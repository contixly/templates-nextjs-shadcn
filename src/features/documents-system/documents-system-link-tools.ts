import { documentsSystemTools } from "./documents-system-tools";
import { DOCUMENTS_SYSTEM_LOG_SCOPE } from "./documents-system-consts";
import {
  DocumentInfo,
  DocumentsSystemBrokenLink,
  DocumentsSystemExtractedLink,
  DocumentsSystemResolvedLink,
} from "./documents-system-types";

const DOCUMENTS_ROOT = "/docs";
const MARKDOWN_LINK_PATTERN = /(?<!!)\[[^\]]+]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const MARKDOWN_REFERENCE_DEFINITION_PATTERN =
  /^\s*\[[^\]]+\]:\s*(?:<([^>\s]+)>|([^<\s]+))(?:\s+["'][^"']*["'])?\s*$/gu;
const MDX_HREF_PATTERN =
  /\bhref=(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\}|\{"([^"]+)"\}|\{'([^']+)'\})/g;
const HTTP_URL_PATTERN = /^https?:\/\//iu;

type DocumentsSystemLinkTargetDocument = Pick<DocumentInfo, "meta" | "url" | "sourcePath">;
type DocumentsSystemLinkSourceDocument = Pick<DocumentInfo, "sourcePath">;

type DocumentsSystemLinkIndexFor<TDocument extends DocumentsSystemLinkTargetDocument> = {
  allByUrl: Map<string, TDocument>;
  productionVisibleByUrl: Map<string, TDocument>;
};

type DocumentsSystemResolvedLinkFor<TDocument extends DocumentsSystemLinkTargetDocument> =
  | {
      state: "valid" | "unpublished";
      href: string;
      targetUrl: string;
      target: TDocument;
    }
  | {
      state: "broken";
      href: string;
      targetUrl: string;
    }
  | {
      state: "external" | "ignored";
      href: string;
    };

const trimTrailingSlash = (value: string) =>
  value.length > 1 ? value.replace(/\/+$/u, "") : value;

const normalizeDocumentsSystemPathname = (pathname: string) => {
  const normalizedPathname = trimTrailingSlash(pathname);

  if (normalizedPathname === DOCUMENTS_ROOT) {
    return "index";
  }

  if (!normalizedPathname.startsWith(`${DOCUMENTS_ROOT}/`)) {
    return undefined;
  }

  const targetUrl = normalizedPathname.slice(DOCUMENTS_ROOT.length + 1).replace(/\/index$/u, "");

  return targetUrl || "index";
};

const decodePathname = (pathname: string) => {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
};

const isExternalHref = (href: string) => HTTP_URL_PATTERN.test(href);

export const normalizeDocumentsSystemHref = (href: string): string | undefined => {
  const trimmed = href.trim();

  if (!trimmed || trimmed.startsWith("#") || isExternalHref(trimmed)) {
    return undefined;
  }

  const [withoutHash] = trimmed.split("#", 1);
  const [withoutQuery] = withoutHash.split("?", 1);

  return normalizeDocumentsSystemPathname(decodePathname(withoutQuery));
};

export const buildDocumentsSystemLinkIndex = <TDocument extends DocumentsSystemLinkTargetDocument>(
  allDocuments: TDocument[]
): DocumentsSystemLinkIndexFor<TDocument> => {
  const allByUrl = new Map<string, TDocument>();
  const productionVisibleByUrl = new Map<string, TDocument>();

  allDocuments.forEach((document) => {
    allByUrl.set(document.url, document);

    if (documentsSystemTools.isDocumentVisible(document.meta, "production")) {
      productionVisibleByUrl.set(document.url, document);
    }
  });

  return { allByUrl, productionVisibleByUrl };
};

export const resolveDocumentsSystemLink = <TDocument extends DocumentsSystemLinkTargetDocument>(
  href: string,
  index: DocumentsSystemLinkIndexFor<TDocument>
): DocumentsSystemResolvedLinkFor<TDocument> => {
  const targetUrl = normalizeDocumentsSystemHref(href);

  if (!targetUrl) {
    return isExternalHref(href.trim()) ? { state: "external", href } : { state: "ignored", href };
  }

  const target = index.allByUrl.get(targetUrl);

  if (!target) {
    return { state: "broken", href, targetUrl };
  }

  if (!index.productionVisibleByUrl.has(targetUrl)) {
    return { state: "unpublished", href, targetUrl, target };
  }

  return { state: "valid", href, targetUrl, target };
};

export const extractDocumentsSystemLinks = (
  sourcePath: string,
  content: string
): DocumentsSystemExtractedLink[] => {
  const links: DocumentsSystemExtractedLink[] = [];
  const lines = content.split(/\r?\n/u);
  let insideFence = false;

  lines.forEach((line, lineIndex) => {
    if (/^\s*```/u.test(line)) {
      insideFence = !insideFence;
      return;
    }

    if (insideFence) {
      return;
    }

    for (const pattern of [
      MARKDOWN_LINK_PATTERN,
      MARKDOWN_REFERENCE_DEFINITION_PATTERN,
      MDX_HREF_PATTERN,
    ]) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(line)) !== null) {
        const href = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];

        if (href && normalizeDocumentsSystemHref(href)) {
          links.push({
            sourcePath,
            href,
            line: lineIndex + 1,
          });
        }
      }
    }
  });

  return links;
};

export function validateDocumentsSystemLinks(
  sourceDocuments: DocumentsSystemLinkTargetDocument[],
  sourceByPath: Map<string, string>
): DocumentsSystemBrokenLink[];
export function validateDocumentsSystemLinks(
  sourceDocuments: DocumentsSystemLinkSourceDocument[],
  sourceByPath: Map<string, string>,
  targetDocuments: DocumentsSystemLinkTargetDocument[]
): DocumentsSystemBrokenLink[];
export function validateDocumentsSystemLinks(
  sourceDocuments: DocumentsSystemLinkSourceDocument[],
  sourceByPath: Map<string, string>,
  targetDocuments?: DocumentsSystemLinkTargetDocument[]
): DocumentsSystemBrokenLink[] {
  const linkTargets = targetDocuments ?? (sourceDocuments as DocumentsSystemLinkTargetDocument[]);
  const index = buildDocumentsSystemLinkIndex(linkTargets);
  const brokenLinks: DocumentsSystemBrokenLink[] = [];

  sourceDocuments.forEach((document) => {
    const content = sourceByPath.get(document.sourcePath);
    if (!content) return;

    extractDocumentsSystemLinks(document.sourcePath, content).forEach((link) => {
      const resolved = resolveDocumentsSystemLink(link.href, index);

      if (resolved.state === "broken") {
        brokenLinks.push({ ...link, targetUrl: resolved.targetUrl });
      }
    });
  });

  return brokenLinks;
}

export const formatDocumentsSystemBrokenLinks = (links: DocumentsSystemBrokenLink[]) =>
  [
    "Documents system has broken internal links:",
    ...links.map((link) => `${link.sourcePath}:${link.line} -> ${link.href}`),
  ].join("\n");

export const assertNoBrokenDocumentsSystemLinks = (links: DocumentsSystemBrokenLink[]) => {
  if (links.length === 0) return;

  throw new Error(formatDocumentsSystemBrokenLinks(links));
};

export const reportDocumentsSystemBrokenLink = (
  sourcePath: string,
  resolved: Extract<DocumentsSystemResolvedLink, { state: "broken" }>,
  line?: number
) => {
  const target =
    typeof line === "number"
      ? `${sourcePath}:${line} -> ${resolved.href}`
      : `${sourcePath} -> ${resolved.href}`;

  console.error(`[${DOCUMENTS_SYSTEM_LOG_SCOPE}] broken link`, target);
};
