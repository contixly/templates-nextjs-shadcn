import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCachedDocuments } from "@features/documents-system/documents-system-actions";
import { createUniqueDocumentHeadingId } from "@features/documents-system/documents-system-heading-tools";
import { getDocumentsSystemEnvironment } from "@features/documents-system/documents-system-runtime";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import {
  DOCUMENTS_SYSTEM_SEARCH_EMPTY_PAGE_LIMIT,
  DOCUMENTS_SYSTEM_SEARCH_QUERY_LIMIT,
  DOCUMENTS_SYSTEM_SEARCH_TYPED_HEADING_LIMIT,
  DOCUMENTS_SYSTEM_SEARCH_TYPED_PAGE_LIMIT,
  DocumentsSystemExtractedHeading,
  DocumentsSystemIndexedHeading,
  DocumentsSystemIndexedPage,
  DocumentsSystemSearchHeadingResult,
  DocumentsSystemSearchIndex,
  DocumentsSystemSearchPageResult,
  DocumentsSystemSearchResponse,
} from "./documents-system-search-types";

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const HEADING_PATTERN = /^(#{2,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm;
const INLINE_MARKDOWN_PATTERN = /[*_`~]/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)]\([^)]+\)/g;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)]\([^)]+\)/g;
const MARKDOWN_HEADING_ID_PATTERN = /\s*\{#[^}]+}\s*$/g;

let cachedSearchIndex: DocumentsSystemSearchIndex | undefined;
const documentsSystemEnvironment = getDocumentsSystemEnvironment();

const ENGLISH_KEYBOARD_LAYOUT = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const RUSSIAN_KEYBOARD_LAYOUT = "йцукенгшщзхъфывапролджэячсмитьбю";

type DocumentsSystemSearchQueryVariant = {
  text: string;
  tokens: string[];
};

const createKeyboardLayoutMap = (sourceLayout: string, targetLayout: string) =>
  new Map(Array.from(sourceLayout, (sourceChar, index) => [sourceChar, targetLayout[index]]));

const ENGLISH_TO_RUSSIAN_KEYBOARD_MAP = createKeyboardLayoutMap(
  ENGLISH_KEYBOARD_LAYOUT,
  RUSSIAN_KEYBOARD_LAYOUT
);
const RUSSIAN_TO_ENGLISH_KEYBOARD_MAP = createKeyboardLayoutMap(
  RUSSIAN_KEYBOARD_LAYOUT,
  ENGLISH_KEYBOARD_LAYOUT
);

export const normalizeDocumentsSystemSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeDocumentsSystemSearchText = (value: string) =>
  normalizeDocumentsSystemSearchText(value).split(" ").filter(Boolean);

type DocumentsSystemKeyboardLayout = "english" | "russian";

const LETTER_PATTERN = /^\p{Letter}$/u;

const getDocumentsSystemCharacterKeyboardLayout = (
  character: string
): DocumentsSystemKeyboardLayout | undefined => {
  if (ENGLISH_TO_RUSSIAN_KEYBOARD_MAP.has(character)) {
    return "english";
  }

  if (RUSSIAN_TO_ENGLISH_KEYBOARD_MAP.has(character)) {
    return "russian";
  }

  return undefined;
};

const getDocumentsSystemQueryKeyboardLayout = (
  query: string
): DocumentsSystemKeyboardLayout | undefined => {
  let layout: DocumentsSystemKeyboardLayout | undefined;
  let hasLayoutLetter = false;

  for (const character of query.toLowerCase()) {
    if (!LETTER_PATTERN.test(character)) {
      continue;
    }

    const characterLayout = getDocumentsSystemCharacterKeyboardLayout(character);

    if (!characterLayout) {
      return undefined;
    }

    if (layout && layout !== characterLayout) {
      return undefined;
    }

    layout = characterLayout;
    hasLayoutLetter = true;
  }

  return hasLayoutLetter ? layout : undefined;
};

const shouldSkipKeyboardLayoutSearchQuery = (
  layout: DocumentsSystemKeyboardLayout,
  query: string
) => layout === "russian" && tokenizeDocumentsSystemSearchText(query).length > 1;

const getKeyboardLayoutSearchQuery = (query: string) => {
  const layout = getDocumentsSystemQueryKeyboardLayout(query);

  if (!layout) {
    return undefined;
  }

  const keyboardLayoutMap =
    layout === "english" ? ENGLISH_TO_RUSSIAN_KEYBOARD_MAP : RUSSIAN_TO_ENGLISH_KEYBOARD_MAP;
  const convertedQuery = Array.from(
    query.toLowerCase(),
    (character) => keyboardLayoutMap.get(character) ?? character
  ).join("");
  const normalizedConvertedQuery = normalizeDocumentsSystemSearchText(convertedQuery);

  if (!normalizedConvertedQuery || shouldSkipKeyboardLayoutSearchQuery(layout, query)) {
    return undefined;
  }

  return normalizedConvertedQuery;
};

const createDocumentsSystemSearchQueryVariants = (
  query: string
): DocumentsSystemSearchQueryVariant[] => {
  const normalizedQuery = normalizeDocumentsSystemSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryVariants = [normalizedQuery, getKeyboardLayoutSearchQuery(query)].filter(
    (variant): variant is string => Boolean(variant)
  );

  return Array.from(new Set(queryVariants)).map((text) => ({
    text,
    tokens: tokenizeDocumentsSystemSearchText(text),
  }));
};

const stripHeadingMarkdown = (value: string) =>
  value
    .replace(MARKDOWN_HEADING_ID_PATTERN, "")
    .replace(MARKDOWN_IMAGE_PATTERN, "$1")
    .replace(MARKDOWN_LINK_PATTERN, "$1")
    .replace(INLINE_MARKDOWN_PATTERN, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const extractDocumentsSystemHeadings = (
  content: string
): DocumentsSystemExtractedHeading[] => {
  const contentWithoutCodeBlocks = content.replace(CODE_BLOCK_PATTERN, "");
  const seenIds = new Map<string, number>();
  const headings: DocumentsSystemExtractedHeading[] = [];
  let match: RegExpExecArray | null;

  while ((match = HEADING_PATTERN.exec(contentWithoutCodeBlocks)) !== null) {
    const level = match[1].length;

    if (level !== 2 && level !== 3) {
      continue;
    }

    const title = stripHeadingMarkdown(match[2]);

    if (!title) {
      continue;
    }

    headings.push({
      level,
      title,
      id: createUniqueDocumentHeadingId(title, seenIds),
    });
  }

  return headings;
};

export const getDamerauLevenshteinDistance = (left: string, right: string) => {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );

      if (
        row > 1 &&
        column > 1 &&
        left[row - 1] === right[column - 2] &&
        left[row - 2] === right[column - 1]
      ) {
        matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + 1);
      }
    }
  }

  return matrix[left.length][right.length];
};

const getAllowedTypoDistance = (token: string) => {
  if (token.length <= 3) {
    return 0;
  }

  if (token.length <= 7) {
    return 1;
  }

  return 2;
};

const isFuzzyTokenMatch = (queryToken: string, candidateToken: string) => {
  const allowedDistance = getAllowedTypoDistance(queryToken);

  if (allowedDistance === 0) {
    return false;
  }

  return (
    Math.abs(candidateToken.length - queryToken.length) <= allowedDistance &&
    getDamerauLevenshteinDistance(queryToken, candidateToken) <= allowedDistance
  );
};

const getEntryScore = (
  entry: { titleText: string; searchText: string },
  queryVariant: DocumentsSystemSearchQueryVariant
) => {
  if (entry.titleText === queryVariant.text) {
    return 100;
  }

  if (entry.titleText.startsWith(queryVariant.text)) {
    return 90;
  }

  if (entry.titleText.includes(queryVariant.text)) {
    return 80;
  }

  if (entry.searchText.includes(queryVariant.text)) {
    return 60;
  }

  const candidateTokens = tokenizeDocumentsSystemSearchText(entry.searchText);
  const hasEveryFuzzyQueryToken = queryVariant.tokens.every((queryToken) =>
    candidateTokens.some((candidateToken) => isFuzzyTokenMatch(queryToken, candidateToken))
  );

  return hasEveryFuzzyQueryToken ? 40 : 0;
};

const getEntryBestScore = (
  entry: { titleText: string; searchText: string },
  queryVariants: DocumentsSystemSearchQueryVariant[]
) =>
  queryVariants.reduce(
    (bestScore, queryVariant) => Math.max(bestScore, getEntryScore(entry, queryVariant)),
    0
  );

const toPageResult = (page: DocumentsSystemIndexedPage): DocumentsSystemSearchPageResult => ({
  type: "page",
  title: page.title,
  description: page.description,
  href: page.href,
  group: page.group,
  parentItem: page.parentItem,
});

const toHeadingResult = (
  heading: DocumentsSystemIndexedHeading
): DocumentsSystemSearchHeadingResult => ({
  type: "heading",
  title: heading.title,
  href: heading.href,
  pageTitle: heading.pageTitle,
  group: heading.group,
  parentItem: heading.parentItem,
});

export async function buildDocumentsSystemSearchIndex(): Promise<DocumentsSystemSearchIndex> {
  const documents = await getCachedDocuments();

  const indexedDocuments = await Promise.all(
    documents.map(async (document, documentOrder) => {
      const href = documentsSystemTools.documentUrlToHref(document.url);
      const source = await readFile(
        join(process.cwd(), "src/features/documents-system/content", document.sourcePath),
        "utf8"
      );

      const page: DocumentsSystemIndexedPage = {
        type: "page",
        title: document.meta.title,
        description: document.meta.description,
        href,
        group: document.meta.group,
        parentItem: document.meta.parentItem,
        order: documentOrder,
        searchText: normalizeDocumentsSystemSearchText(
          [
            document.meta.title,
            document.meta.description,
            document.meta.group,
            document.meta.parentItem,
            document.url,
          ].join(" ")
        ),
        titleText: normalizeDocumentsSystemSearchText(document.meta.title),
      };

      const headings = extractDocumentsSystemHeadings(source).map((heading, headingOrder) => ({
        type: "heading" as const,
        title: heading.title,
        href: `${href}#${heading.id}`,
        pageTitle: document.meta.title,
        group: document.meta.group,
        parentItem: document.meta.parentItem,
        order: documentOrder * 10000 + headingOrder,
        searchText: normalizeDocumentsSystemSearchText(
          [
            heading.title,
            document.meta.title,
            document.meta.description,
            document.meta.group,
            document.meta.parentItem,
          ].join(" ")
        ),
        titleText: normalizeDocumentsSystemSearchText(heading.title),
      }));

      return { page, headings };
    })
  );

  return {
    pages: indexedDocuments.map(({ page }) => page),
    headings: indexedDocuments.flatMap(({ headings }) => headings),
  };
}

export async function getDocumentsSystemSearchIndex() {
  if (documentsSystemEnvironment !== "local" && cachedSearchIndex) {
    return cachedSearchIndex;
  }

  const index = await buildDocumentsSystemSearchIndex();

  if (documentsSystemEnvironment !== "local") {
    cachedSearchIndex = index;
  }

  return index;
}

const rankDocumentsSystemSearchEntries = <
  T extends { titleText: string; searchText: string; order: number },
>(
  entries: T[],
  queryVariants: DocumentsSystemSearchQueryVariant[]
) =>
  entries
    .map((entry) => ({
      entry,
      score: getEntryBestScore(entry, queryVariants),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.entry.order - right.entry.order)
    .map(({ entry }) => entry);

export const searchDocumentsSystemIndex = (
  index: DocumentsSystemSearchIndex,
  query: string
): DocumentsSystemSearchResponse => {
  const limitedQuery = query.slice(0, DOCUMENTS_SYSTEM_SEARCH_QUERY_LIMIT);
  const queryVariants = createDocumentsSystemSearchQueryVariants(limitedQuery);

  if (queryVariants.length === 0) {
    return {
      pages: index.pages.slice(0, DOCUMENTS_SYSTEM_SEARCH_EMPTY_PAGE_LIMIT).map(toPageResult),
      headings: [],
    };
  }

  return {
    pages: rankDocumentsSystemSearchEntries(index.pages, queryVariants)
      .slice(0, DOCUMENTS_SYSTEM_SEARCH_TYPED_PAGE_LIMIT)
      .map(toPageResult),
    headings: rankDocumentsSystemSearchEntries(index.headings, queryVariants)
      .slice(0, DOCUMENTS_SYSTEM_SEARCH_TYPED_HEADING_LIMIT)
      .map(toHeadingResult),
  };
};

export async function searchDocumentsSystem(query: string) {
  return searchDocumentsSystemIndex(await getDocumentsSystemSearchIndex(), query);
}
