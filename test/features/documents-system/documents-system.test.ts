jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

import { readFile } from "node:fs/promises";
import routes from "@features/routes";
import {
  getCachedDocumentsSystemRegistry,
  loadDocumentsSystemRegistry,
} from "@features/documents-system/documents-system-actions";
import { validateDocumentsSystemLinks } from "@features/documents-system/documents-system-link-tools";
import { searchDocumentsSystemIndex } from "@features/documents-system/documents-system-search-tools";
import { loadMessages } from "@/src/i18n/messages";

describe("documents system", () => {
  it("is registered in application routes", () => {
    expect(routes.documents_system.pages.home.path()).toBe("/docs");
  });

  it("loads visible public documents without broken internal links", async () => {
    const registry = await loadDocumentsSystemRegistry();

    expect(registry.visibleDocuments.map((document) => document.url)).toEqual([
      "index",
      "general/glossary",
      "workspace",
      "history/change-logs",
      "history/change-logs/2026-03-23-weekly-changelog",
      "history/releases",
      "history/releases/2.0.11",
    ]);
    expect(validateDocumentsSystemLinks(registry.allDocuments, registry.sourceByPath)).toEqual([]);
  });

  it("searches pages from the documents registry", async () => {
    const registry = await getCachedDocumentsSystemRegistry();
    const response = searchDocumentsSystemIndex(
      {
        pages: registry.visibleDocuments.map((document, order) => ({
          type: "page",
          title: document.meta.title,
          description: document.meta.description,
          href:
            document.url === "index"
              ? routes.documents_system.pages.home.path()
              : `${routes.documents_system.pages.home.path()}/${document.url}`,
          group: document.meta.group,
          parentItem: document.meta.parentItem,
          order,
          searchText: [
            document.meta.title,
            document.meta.description,
            document.meta.group,
            document.meta.parentItem,
          ]
            .join(" ")
            .toLowerCase(),
          titleText: document.meta.title.toLowerCase(),
        })),
        headings: [],
      },
      "глоссарий"
    );

    expect(response.pages[0]).toMatchObject({
      title: "Глоссарий",
      href: "/docs/general/glossary",
    });
  });

  it("loads documents-system UI messages for supported locales", async () => {
    const enMessages = await loadMessages("en");
    const ruMessages = await loadMessages("ru");

    expect(enMessages).toHaveProperty("documentsSystem.ui.search.openLabel", "Search docs");
    expect(ruMessages).toHaveProperty(
      "documentsSystem.ui.search.openLabel",
      "Поиск по документации"
    );
  });

  it("does not render the global documentation shortcut inside the documentation header", async () => {
    const source = await readFile(
      "src/features/documents-system/ui/documents-system-header.tsx",
      "utf8"
    );

    expect(source).not.toContain("DocumentationRootLink");
  });
});
