export const DOCUMENTS_SYSTEM_SEARCH_EMPTY_PAGE_LIMIT = 32;
export const DOCUMENTS_SYSTEM_SEARCH_TYPED_PAGE_LIMIT = 8;
export const DOCUMENTS_SYSTEM_SEARCH_TYPED_HEADING_LIMIT = 8;
export const DOCUMENTS_SYSTEM_SEARCH_QUERY_LIMIT = 120;

export type DocumentsSystemSearchPageResult = {
  type: "page";
  title: string;
  description: string;
  href: string;
  group: string;
  parentItem: string;
};

export type DocumentsSystemSearchHeadingResult = {
  type: "heading";
  title: string;
  href: string;
  pageTitle: string;
  group: string;
  parentItem: string;
};

export type DocumentsSystemSearchResponse = {
  pages: DocumentsSystemSearchPageResult[];
  headings: DocumentsSystemSearchHeadingResult[];
};

export type DocumentsSystemIndexedPage = DocumentsSystemSearchPageResult & {
  order: number;
  searchText: string;
  titleText: string;
};

export type DocumentsSystemIndexedHeading = DocumentsSystemSearchHeadingResult & {
  order: number;
  searchText: string;
  titleText: string;
};

export type DocumentsSystemSearchIndex = {
  pages: DocumentsSystemIndexedPage[];
  headings: DocumentsSystemIndexedHeading[];
};

export type DocumentsSystemExtractedHeading = {
  level: 2 | 3;
  title: string;
  id: string;
};
