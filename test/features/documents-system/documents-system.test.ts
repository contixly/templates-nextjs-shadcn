jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

import { readFile } from "node:fs/promises";
import routes from "@features/routes";
import {
  getCachedDocumentsSystemRegistry,
  loadDocumentsSystemRegistry,
  resolveDocumentsSystemRegistryDocuments,
} from "@features/documents-system/documents-system-actions";
import {
  buildDocumentsSystemLinkIndex,
  validateDocumentsSystemLinks,
} from "@features/documents-system/documents-system-link-tools";
import { searchDocumentsSystemIndex } from "@features/documents-system/documents-system-search-tools";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import type {
  DocumentsSystemDocumentVariant,
  DocumentsSystemMetadata,
} from "@features/documents-system/documents-system-types";
import { loadMessages } from "@/src/i18n/messages";

describe("documents system", () => {
  const previousDefaultLocale = process.env.PUBLIC_DEFAULT_LOCALE;

  afterEach(() => {
    if (previousDefaultLocale === undefined) {
      delete process.env.PUBLIC_DEFAULT_LOCALE;
    } else {
      process.env.PUBLIC_DEFAULT_LOCALE = previousDefaultLocale;
    }
  });

  const baseRegistryMeta = (title: string): DocumentsSystemMetadata => ({
    title,
    description: `${title} description`,
    group: "Group",
    parentItem: "Parent",
    order: 10,
    status: "published",
    toc: true,
  });

  const registryVariant = (
    sourcePath: string,
    contentLocale: "en" | "ru",
    title: string
  ): DocumentsSystemDocumentVariant => ({
    url: "general/authoring/sample",
    slug: ["general", "authoring", "sample"],
    sourcePath,
    canonicalSourcePath: "general/authoring/sample.mdx",
    contentLocale,
    hasExplicitLocale: true,
    meta: baseRegistryMeta(title),
  });

  const assertValidateDocumentsSystemLinksRejectsSourceOnlyCall = () => {
    // @ts-expect-error Source-only documents require explicit canonical targets.
    validateDocumentsSystemLinks([{ sourcePath: "x.md" }], new Map<string, string>());
  };
  void assertValidateDocumentsSystemLinksRejectsSourceOnlyCall;

  it("is registered in application routes", () => {
    expect(routes.documents_system.pages.home.path()).toBe("/docs");
  });

  it("defaults registry locale to en when PUBLIC_DEFAULT_LOCALE is empty or invalid", async () => {
    for (const defaultLocale of ["", "de"]) {
      process.env.PUBLIC_DEFAULT_LOCALE = defaultLocale;

      await jest.isolateModulesAsync(async () => {
        const { loadDocumentsSystemRegistry: loadIsolatedDocumentsSystemRegistry } =
          await import("@features/documents-system/documents-system-actions");

        const registry = await loadIsolatedDocumentsSystemRegistry();

        expect(registry.locale).toBe("en");
        expect(new Set(registry.allDocuments.map((document) => document.requestedLocale))).toEqual(
          new Set(["en"])
        );
      });
    }
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

  describe("locale registry resolution", () => {
    it("resolves requested locale variants by canonical URL", () => {
      const documents = resolveDocumentsSystemRegistryDocuments(
        [
          registryVariant("general/authoring/sample.en.mdx", "en", "Sample"),
          registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации"),
        ],
        "ru"
      );

      expect(documents).toHaveLength(1);
      expect(documents[0]).toMatchObject({
        url: "general/authoring/sample",
        sourcePath: "general/authoring/sample.ru.mdx",
        requestedLocale: "ru",
        contentLocale: "ru",
        isLocaleFallback: false,
        availableLocales: ["en", "ru"],
      });
    });

    it("uses stable fallback content when requested locale is missing", () => {
      const documents = resolveDocumentsSystemRegistryDocuments(
        [registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
        "en"
      );

      expect(documents[0]).toMatchObject({
        requestedLocale: "en",
        contentLocale: "ru",
        isLocaleFallback: true,
        sourcePath: "general/authoring/sample.ru.mdx",
        availableLocales: ["ru"],
      });
    });

    it("throws on duplicate variants for one canonical URL and locale", () => {
      let thrown: unknown;

      try {
        resolveDocumentsSystemRegistryDocuments(
          [
            registryVariant("general/authoring/sample.mdx", "en", "Sample"),
            registryVariant("general/authoring/sample.en.mdx", "en", "Sample duplicate"),
          ],
          "en"
        );
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain("Duplicate documents-system content locale");
      expect((thrown as Error).message).toContain("Canonical URL: general/authoring/sample");
      expect((thrown as Error).message).toContain("Locale: en");
      expect((thrown as Error).message).toContain("general/authoring/sample.mdx");
      expect((thrown as Error).message).toContain("general/authoring/sample.en.mdx");
    });

    it("builds link targets from canonical document URLs", () => {
      const registry = resolveDocumentsSystemRegistryDocuments(
        [
          registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации"),
          {
            ...registryVariant(
              "general/authoring/how-to-write-docs.ru.md",
              "ru",
              "Как писать документацию"
            ),
            url: "general/authoring/how-to-write-docs",
            slug: ["general", "authoring", "how-to-write-docs"],
            canonicalSourcePath: "general/authoring/how-to-write-docs.md",
          },
        ],
        "ru"
      );

      const index = buildDocumentsSystemLinkIndex(registry);

      expect(index.allByUrl.has("general/authoring/sample")).toBe(true);
      expect(index.allByUrl.has("general/authoring/sample.ru")).toBe(false);
    });

    it("validates source variant links against canonical target documents", () => {
      const sourcePath = "general/authoring/sample.ru.mdx";
      const sourceVariants = [{ sourcePath }];
      const sourceByPath = new Map([
        [
          sourcePath,
          [
            "[Canonical](/docs/general/authoring/sample)",
            "[Locale suffix](/docs/general/authoring/sample.ru)",
          ].join("\n"),
        ],
      ]);
      const canonicalTargets = resolveDocumentsSystemRegistryDocuments(
        [registryVariant(sourcePath, "ru", "Возможности документации")],
        "ru"
      );

      expect(validateDocumentsSystemLinks(sourceVariants, sourceByPath, canonicalTargets)).toEqual([
        {
          sourcePath,
          href: "/docs/general/authoring/sample.ru",
          line: 2,
          targetUrl: "general/authoring/sample.ru",
        },
      ]);
    });

    it("builds static params from canonical slugs without locale suffixes", () => {
      const documents = resolveDocumentsSystemRegistryDocuments(
        [registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
        "ru"
      );

      expect(documentsSystemTools.buildStaticParams(documents)).toEqual([
        { slug: ["general", "authoring", "sample"] },
      ]);
    });

    it("rejects static params with locale-suffixed slug segments", () => {
      const [document] = resolveDocumentsSystemRegistryDocuments(
        [registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
        "ru"
      );

      expect(() =>
        documentsSystemTools.buildStaticParams([
          { ...document, slug: ["general", "authoring", "sample.ru"] },
        ])
      ).toThrow(
        "Documents-system static params must use canonical slugs without locale suffixes: general/authoring/sample.ru"
      );
    });
  });
});
