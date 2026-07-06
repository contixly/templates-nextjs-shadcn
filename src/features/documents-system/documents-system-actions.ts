import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { glob } from "glob";
import matter from "gray-matter";
import { locales } from "@/src/i18n/config";
import type { AppLocale } from "@/src/i18n/config";
import {
  assertNoBrokenDocumentsSystemLinks,
  buildDocumentsSystemLinkIndex,
  validateDocumentsSystemLinks,
} from "./documents-system-link-tools";
import {
  parseDocumentsSystemContentPath,
  resolveDocumentsSystemDefaultContentLocale,
} from "./documents-system-locale-tools";
import { DOCUMENTS_SYSTEM_LOG_SCOPE } from "./documents-system-consts";
import { getDocumentsSystemEnvironment } from "./documents-system-runtime";
import {
  CACHE_DocumentsSystemTag,
  DocumentInfo,
  DocumentModule,
  DocumentsSystemDocumentVariant,
  DocumentsSystemLinkIndex,
  DocumentsSystemMetadata,
} from "./documents-system-types";
import { documentsSystemTools } from "./documents-system-tools";

export type DocumentsSystemRegistry = {
  allDocuments: DocumentInfo[];
  visibleDocuments: DocumentInfo[];
  allVariants: DocumentsSystemDocumentVariant[];
  sourceByPath: Map<string, string>;
  linkIndex: DocumentsSystemLinkIndex;
  locale: AppLocale;
};

let documentsSourceByPath: Map<string, string> | undefined = undefined;
const allDocumentsByLocale = new Map<AppLocale, DocumentInfo[]>();
const visibleDocumentsByLocale = new Map<AppLocale, DocumentInfo[]>();
const documentsLinkIndexByLocale = new Map<AppLocale, DocumentsSystemLinkIndex>();
const documentsRegistryByLocale = new Map<AppLocale, DocumentsSystemRegistry>();
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

const sortLocales = (values: Iterable<AppLocale>) =>
  [...values].sort((left, right) => locales.indexOf(left) - locales.indexOf(right));

const findPreferredVariant = (
  variants: DocumentsSystemDocumentVariant[],
  requestedLocale: AppLocale
) => {
  const defaultLocale = resolveDocumentsSystemDefaultContentLocale();

  return (
    variants.find((variant) => variant.contentLocale === requestedLocale) ??
    variants.find((variant) => !variant.hasExplicitLocale) ??
    variants.find((variant) => variant.contentLocale === defaultLocale) ??
    sortLocales(variants.map((variant) => variant.contentLocale))
      .map((locale) => variants.find((variant) => variant.contentLocale === locale))
      .find((variant): variant is DocumentsSystemDocumentVariant => Boolean(variant))
  );
};

export const resolveDocumentsSystemRegistryDocuments = (
  variants: DocumentsSystemDocumentVariant[],
  requestedLocale: AppLocale
): DocumentInfo[] => {
  const variantsByUrl = new Map<string, DocumentsSystemDocumentVariant[]>();

  variants.forEach((variant) => {
    const urlVariants = variantsByUrl.get(variant.url) ?? [];
    const duplicate = urlVariants.find(
      (candidate) => candidate.contentLocale === variant.contentLocale
    );

    if (duplicate) {
      throw new Error(
        [
          "Duplicate documents-system content locale.",
          `Canonical URL: ${variant.url}`,
          `Locale: ${variant.contentLocale}`,
          `Files: ${duplicate.sourcePath}, ${variant.sourcePath}`,
        ].join("\n")
      );
    }

    urlVariants.push(variant);
    variantsByUrl.set(variant.url, urlVariants);
  });

  return documentsSystemTools.sortDocuments(
    [...variantsByUrl.values()].map((urlVariants) => {
      const selected = findPreferredVariant(urlVariants, requestedLocale);

      if (!selected) {
        throw new Error("Documents-system canonical URL has no variants.");
      }

      const availableLocales = sortLocales(urlVariants.map((variant) => variant.contentLocale));

      return {
        url: selected.url,
        slug: selected.slug,
        sourcePath: selected.sourcePath,
        canonicalSourcePath: selected.canonicalSourcePath,
        requestedLocale,
        contentLocale: selected.contentLocale,
        isLocaleFallback: selected.contentLocale !== requestedLocale,
        availableLocales,
        meta: selected.meta,
      };
    })
  );
};

const readDocumentFiles = async (): Promise<{
  variants: DocumentsSystemDocumentVariant[];
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

      const parsedPath = parseDocumentsSystemContentPath(path);
      sourceByPath.set(parsedPath.sourcePath, parsed.content);

      const enrichedMeta: DocumentsSystemMetadata = {
        ...meta,
        source: meta.source ?? parsedPath.sourcePath,
        reading: meta.reading ?? computeReading(parsed.content),
        editedAt: meta.editedAt ?? computeEditedAt(absPath),
      };

      const info: DocumentsSystemDocumentVariant = {
        url: parsedPath.canonicalUrl,
        slug: documentsSystemTools.documentUrlToSlug(parsedPath.canonicalUrl),
        sourcePath: parsedPath.sourcePath,
        canonicalSourcePath: parsedPath.canonicalSourcePath,
        contentLocale: parsedPath.contentLocale,
        hasExplicitLocale: parsedPath.hasExplicitLocale,
        meta: enrichedMeta,
      };
      return info;
    })
  );

  const sortedVariants = documentsSystemTools.sortDocuments(
    loaded.filter((document): document is DocumentsSystemDocumentVariant => Boolean(document))
  );

  return {
    variants: sortedVariants,
    sourceByPath,
  };
};

const buildDocumentsSystemRegistry = async (
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentsSystemRegistry> => {
  const loaded = await readDocumentFiles();
  const allDocuments = resolveDocumentsSystemRegistryDocuments(loaded.variants, locale);
  const linkIndex = buildDocumentsSystemLinkIndex(allDocuments);
  const filteredDocuments = allDocuments.filter((document) =>
    documentsSystemTools.isDocumentVisible(document.meta, documentsSystemEnvironment)
  );

  if (shouldAssertBrokenLinks) {
    assertNoBrokenDocumentsSystemLinks(
      validateDocumentsSystemLinks(loaded.variants, loaded.sourceByPath, allDocuments)
    );
  }

  return {
    allDocuments,
    visibleDocuments: filteredDocuments,
    allVariants: loaded.variants,
    sourceByPath: loaded.sourceByPath,
    linkIndex,
    locale,
  };
};

const assignDocumentsSystemRegistryCache = (registry: DocumentsSystemRegistry) => {
  allDocumentsByLocale.set(registry.locale, registry.allDocuments);
  visibleDocumentsByLocale.set(registry.locale, registry.visibleDocuments);
  documentsSourceByPath = registry.sourceByPath;
  documentsLinkIndexByLocale.set(registry.locale, registry.linkIndex);
  documentsRegistryByLocale.set(registry.locale, registry);
};

export async function loadDocumentsSystemRegistry(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentsSystemRegistry> {
  if (shouldCacheDocuments && documentsRegistryByLocale.has(locale)) {
    return documentsRegistryByLocale.get(locale)!;
  }

  const registry = await buildDocumentsSystemRegistry(locale);
  assignDocumentsSystemRegistryCache(registry);

  return registry;
}

export async function loadAllDocuments(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentInfo[]> {
  if (shouldCacheDocuments && allDocumentsByLocale.has(locale)) {
    return allDocumentsByLocale.get(locale)!;
  }

  const registry = await loadDocumentsSystemRegistry(locale);

  return registry.allDocuments;
}

export async function loadDocuments(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentInfo[]> {
  if (shouldCacheDocuments && visibleDocumentsByLocale.has(locale)) {
    return visibleDocumentsByLocale.get(locale)!;
  }

  const registry = await loadDocumentsSystemRegistry(locale);

  return registry.visibleDocuments;
}

export async function getDocumentsSystemLinkIndex(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentsSystemLinkIndex> {
  if (shouldCacheDocuments && documentsLinkIndexByLocale.has(locale)) {
    return documentsLinkIndexByLocale.get(locale)!;
  }

  const registry = await loadDocumentsSystemRegistry(locale);

  return registry.linkIndex;
}

export async function getDocumentsSystemSourceByPath(): Promise<Map<string, string>> {
  if (shouldCacheDocuments && documentsSourceByPath) return documentsSourceByPath;

  const registry = await loadDocumentsSystemRegistry();

  return registry.sourceByPath;
}

export async function getCachedDocumentsSystemRegistry(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentsSystemRegistry> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("registry"));

  return loadDocumentsSystemRegistry(locale);
}

export async function getCachedAllDocuments(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentInfo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("all"));

  return loadAllDocuments(locale);
}

export async function getCachedDocuments(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentInfo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("visible"));

  return loadDocuments(locale);
}

export async function getCachedDocumentsSystemLinkIndex(
  locale: AppLocale = resolveDocumentsSystemDefaultContentLocale()
): Promise<DocumentsSystemLinkIndex> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_DocumentsSystemTag("link_index"));

  return getDocumentsSystemLinkIndex(locale);
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
