import { DefaultLocale, isAppLocale, locales, resolveAppLocale } from "@/src/i18n/config";
import type { AppLocale } from "@/src/i18n/config";
import type { DocumentsSystemParsedContentPath } from "./documents-system-types";

const CONTENT_PREFIX_PATTERN = /^content\//u;
const MARKDOWN_EXTENSION_PATTERN = /\.(md|mdx)$/iu;
const LOCALE_SUFFIX_PATTERN = /\.([a-z]{2})(\.(?:md|mdx))$/iu;

const normalizeSlashes = (value: string) => value.replaceAll("\\", "/");

const normalizeDocumentUrlFromCanonicalSourcePath = (sourcePath: string) => {
  const withoutExtension = sourcePath.replace(MARKDOWN_EXTENSION_PATTERN, "");

  if (withoutExtension === "index") {
    return "index";
  }

  return withoutExtension.replace(/\/index$/u, "");
};

export const resolveDocumentsSystemDefaultContentLocale = (): AppLocale =>
  resolveAppLocale(process.env.PUBLIC_DEFAULT_LOCALE ?? DefaultLocale);

export const assertValidDocumentsSystemRequestedLocale = (value: string): AppLocale => {
  if (isAppLocale(value)) {
    return value;
  }

  throw new Error(`Unsupported documents-system requested locale: ${value}`);
};

export const parseDocumentsSystemContentPath = (
  filePath: string
): DocumentsSystemParsedContentPath => {
  const sourcePath = normalizeSlashes(filePath).replace(CONTENT_PREFIX_PATTERN, "");
  const localeMatch = sourcePath.match(LOCALE_SUFFIX_PATTERN);
  const rawLocale = localeMatch?.[1]?.toLowerCase();
  let explicitLocale: AppLocale | undefined;

  if (rawLocale) {
    if (!isAppLocale(rawLocale)) {
      throw new Error(
        `Unsupported documents-system content locale "${rawLocale}" in ${sourcePath}. Supported locales: ${locales.join(", ")}`
      );
    }

    explicitLocale = rawLocale;
  }

  const contentLocale = explicitLocale ?? resolveDocumentsSystemDefaultContentLocale();
  const canonicalSourcePath = explicitLocale
    ? sourcePath.replace(LOCALE_SUFFIX_PATTERN, "$2")
    : sourcePath;
  const canonicalUrl = normalizeDocumentUrlFromCanonicalSourcePath(canonicalSourcePath);

  return {
    sourcePath,
    canonicalSourcePath,
    canonicalUrl,
    contentLocale,
    ...(explicitLocale ? { explicitLocale } : {}),
    hasExplicitLocale: Boolean(explicitLocale),
  };
};
