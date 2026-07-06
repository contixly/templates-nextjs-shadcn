import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { DOCUMENTS_SYSTEM_LOG_SCOPE } from "@features/documents-system/documents-system-consts";
import {
  DOCUMENTS_SYSTEM_SEARCH_QUERY_LIMIT,
  type DocumentsSystemSearchResponse,
} from "@features/documents-system/documents-system-search-types";
import { searchDocumentsSystem } from "@features/documents-system/documents-system-search-tools";

const cacheHeaders = {
  "Cache-Control": "no-store",
};

const emptySearchResponse: DocumentsSystemSearchResponse = {
  pages: [],
  headings: [],
};

const getSearchQuery = (request: NextRequest | Request) =>
  new URL(request.url).searchParams
    .get("q")
    ?.trim()
    .slice(0, DOCUMENTS_SYSTEM_SEARCH_QUERY_LIMIT) ?? "";

export async function GET(request: NextRequest | Request) {
  const query = getSearchQuery(request);

  try {
    return NextResponse.json(await searchDocumentsSystem(query), { headers: cacheHeaders });
  } catch (error) {
    console.error(`[${DOCUMENTS_SYSTEM_LOG_SCOPE}] search failed`, error);

    return NextResponse.json(emptySearchResponse, {
      status: 500,
      headers: cacheHeaders,
    });
  }
}
