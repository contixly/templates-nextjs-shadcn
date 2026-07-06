import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { glob } from "glob";
import matter from "gray-matter";
import {
  assertNoBrokenDocumentsSystemLinks,
  buildDocumentsSystemLinkIndex,
  validateDocumentsSystemLinks,
} from "./documents-system-link-tools";
import { DOCUMENTS_SYSTEM_LOG_SCOPE } from "./documents-system-consts";
import { getDocumentsSystemEnvironment } from "./documents-system-runtime";
import {
  CACHE_DocumentsSystemTag,
  DocumentInfo,
  DocumentModule,
  DocumentsSystemLinkIndex,
  DocumentsSystemMetadata,
} from "./documents-system-types";
import { documentsSystemTools } from "./documents-system-tools";

export type DocumentsSystemRegistry = {
  allDocuments: DocumentInfo[];
  visibleDocuments: DocumentInfo[];
  sourceByPath: Map<string, string>;
  linkIndex: DocumentsSystemLinkIndex;
};

let allDocuments: DocumentInfo[] | undefined = undefined;
let visibleDocuments: DocumentInfo[] | undefined = undefined;
let documentsSourceByPath: Map<string, string> | undefined = undefined;
let documentsLinkIndex: DocumentsSystemLinkIndex | undefined = undefined;
let documentsRegistry: DocumentsSystemRegistry | undefined = undefined;
const documentsSystemEnvironment = getDocumentsSystemEnvironment();
const shouldCacheDocuments = documentsSystemEnvironment !== "local";
const shouldAssertBrokenLinks =
  process.env.NODE_ENV === "production" || documentsSystemEnvironment !== "local";

const editedAtCache = new Map<string, string>();

const READING_WORDS_PER_MINUTE = 180;

const computeReading = (raw: string): string => {
  const stripped = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ");
  const words = stripped.split(/\s+/u).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / READING_WORDS_PER_MINUTE));
  return `${minutes} мин`;
};

const computeEditedAt = (absPath: string): string => {
  const cached = editedAtCache.get(absPath);
  if (cached) return cached;

  let value: string | undefined;
  try {
    const stdout = execFileSync("git", ["log", "-1", "--format=%cs", "--", absPath], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (stdout) value = stdout;
  } catch {
    // ignore — fall through to mtime
  }

  if (!value) {
    try {
      value = statSync(absPath).mtime.toISOString().slice(0, 10);
    } catch {
      value = new Date().toISOString().slice(0, 10);
    }
  }

  editedAtCache.set(absPath, value);
  return value;
};

const readDocumentFiles = async (): Promise<{
  documents: DocumentInfo[];
  sourceByPath: Map<string, string>;
}> => {
  const paths = await glob("content/**/*.{md,mdx}", {
    cwd: "src/features/documents-system",
    absolute: false,
  });
  const sourceByPath = new Map<string, string>();

  const loaded = await Promise.all(
    paths.map(async (path) => {
      const absPath = join(process.cwd(), "src/features/documents-system", path);
      const content = await readFile(absPath, "utf8");
      const parsed = matter(content);
      const meta = documentsSystemTools.validateMetadata(parsed.data);

      if (!meta) {
        console.warn(`[${DOCUMENTS_SYSTEM_LOG_SCOPE}] skipped ${path}`);
        return undefined;
      }

      const sourcePath = path.replace(/^content\//, "");
      sourceByPath.set(sourcePath, parsed.content);

      const enrichedMeta: DocumentsSystemMetadata = {
        ...meta,
        source: meta.source ?? sourcePath,
        reading: meta.reading ?? computeReading(parsed.content),
        editedAt: meta.editedAt ?? computeEditedAt(absPath),
      };
      const url = documentsSystemTools.normalizeDocumentUrl(path);

      const info: DocumentInfo = {
        url,
        slug: documentsSystemTools.documentUrlToSlug(url),
        sourcePath,
        meta: enrichedMeta,
      };
      return info;
    })
  );

  const sortedDocuments = documentsSystemTools.sortDocuments(
    loaded.filter((document): document is DocumentInfo => Boolean(document))
  );

  return {
    documents: sortedDocuments,
    sourceByPath,
  };
};

const buildDocumentsSystemRegistry = async (): Promise<DocumentsSystemRegistry> => {
  const loaded = await readDocumentFiles();
  const linkIndex = buildDocumentsSystemLinkIndex(loaded.documents);
  const filteredDocuments = loaded.documents.filter((document) =>
    documentsSystemTools.isDocumentVisible(document.meta, documentsSystemEnvironment)
  );

  if (shouldAssertBrokenLinks) {
    assertNoBrokenDocumentsSystemLinks(
      validateDocumentsSystemLinks(loaded.documents, loaded.sourceByPath)
    );
  }

  return {
    allDocuments: loaded.documents,
    visibleDocuments: filteredDocuments,
    sourceByPath: loaded.sourceByPath,
    linkIndex,
  };
};

const assignDocumentsSystemRegistryCache = (registry: DocumentsSystemRegistry) => {
  allDocuments = registry.allDocuments;
  visibleDocuments = registry.visibleDocuments;
  documentsSourceByPath = registry.sourceByPath;
  documentsLinkIndex = registry.linkIndex;
  documentsRegistry = registry;
};

export async function loadDocumentsSystemRegistry(): Promise<DocumentsSystemRegistry> {
  if (shouldCacheDocuments && documentsRegistry) return documentsRegistry;

  const registry = await buildDocumentsSystemRegistry();
  assignDocumentsSystemRegistryCache(registry);

  return registry;
}

export async function loadAllDocuments(): Promise<DocumentInfo[]> {
  if (shouldCacheDocuments && allDocuments) return allDocuments;

  const registry = await loadDocumentsSystemRegistry();

  return registry.allDocuments;
}

export async function loadDocuments(): Promise<DocumentInfo[]> {
  if (shouldCacheDocuments && visibleDocuments) return visibleDocuments;

  const registry = await loadDocumentsSystemRegistry();

  return registry.visibleDocuments;
}

export async function getDocumentsSystemLinkIndex(): Promise<DocumentsSystemLinkIndex> {
  if (shouldCacheDocuments && documentsLinkIndex) return documentsLinkIndex;

  const registry = await loadDocumentsSystemRegistry();

  return registry.linkIndex;
}

export async function getDocumentsSystemSourceByPath(): Promise<Map<string, string>> {
  if (shouldCacheDocuments && documentsSourceByPath) return documentsSourceByPath;

  const registry = await loadDocumentsSystemRegistry();

  return registry.sourceByPath;
}

export async function getCachedDocumentsSystemRegistry(): Promise<DocumentsSystemRegistry> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("registry"));

  return loadDocumentsSystemRegistry();
}

export async function getCachedAllDocuments(): Promise<DocumentInfo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("all"));

  return loadAllDocuments();
}

export async function getCachedDocuments(): Promise<DocumentInfo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("visible"));

  return loadDocuments();
}

export async function getCachedDocumentsSystemLinkIndex(): Promise<DocumentsSystemLinkIndex> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("link_index"));

  return getDocumentsSystemLinkIndex();
}

export async function getCachedDocumentsSystemSourceByPath(): Promise<Map<string, string>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("source_by_path"));

  return getDocumentsSystemSourceByPath();
}

export async function importDocumentModule(document: DocumentInfo): Promise<DocumentModule> {
  return import(`@features/documents-system/content/${document.sourcePath}`);
}
