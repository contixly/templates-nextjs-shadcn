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
import {
  buildDocumentsSystemSearchIndexFromDocuments,
  searchDocumentsSystemIndex,
} from "@features/documents-system/documents-system-search-tools";
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
    expect(routes.documents_system.pages.home.i18n.namespace).toBe("documentsSystem.pages.home");
  });

  it("throws clearly when source-only link validation omits canonical targets at runtime", () => {
    const sourceOnlyDocuments = [{ sourcePath: "x.md" }] as unknown as {
      sourcePath: string;
      url: string;
      meta: DocumentsSystemMetadata;
    }[];

    expect(() =>
      validateDocumentsSystemLinks(sourceOnlyDocuments, new Map<string, string>())
    ).toThrow("requires targetDocuments when validating source-only documents");
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

  it("loads visible public documents as canonical URLs without locale suffixes", async () => {
    const registry = await loadDocumentsSystemRegistry("en");

    const visibleUrls = registry.visibleDocuments.map((document) => document.url);

    expect(visibleUrls).toEqual(
      expect.arrayContaining([
        "index",
        "general/glossary",
        "workspace",
        "history/change-logs",
        "history/change-logs/2026-04-13-weekly-changelog",
        "history/change-logs/2026-04-20-weekly-changelog",
        "history/change-logs/2026-04-27-weekly-changelog",
        "history/change-logs/2026-05-04-weekly-changelog",
        "history/change-logs/2026-07-06-weekly-changelog",
        "history/releases",
        "history/releases/0.0.10",
      ])
    );
    expect(registry.visibleDocuments.every((document) => !document.url.endsWith(".ru"))).toBe(true);
    expect(documentsSystemTools.findDocument(registry.visibleDocuments, "index")).toMatchObject({
      sourcePath: "index.en.mdx",
      contentLocale: "en",
      isLocaleFallback: false,
    });
    expect(
      validateDocumentsSystemLinks(
        registry.allVariants,
        registry.sourceByPath,
        registry.allDocuments
      )
    ).toEqual([]);
  });

  it("formats computed reading time with the requested registry locale", async () => {
    const enRegistry = await loadDocumentsSystemRegistry("en");
    const ruRegistry = await loadDocumentsSystemRegistry("ru");
    const enDocument = documentsSystemTools.findDocument(enRegistry.visibleDocuments, "index");
    const ruDocument = documentsSystemTools.findDocument(ruRegistry.visibleDocuments, "index");

    expect(enDocument?.meta.reading).toMatch(/\smin$/);
    expect(enDocument?.meta.reading).not.toContain("мин");
    expect(ruDocument?.meta.reading).toMatch(/\sмин$/);
  });

  it("loads authoring pages from matching english and russian variants", async () => {
    const enRegistry = await loadDocumentsSystemRegistry("en");
    const ruRegistry = await loadDocumentsSystemRegistry("ru");
    const findDocument = (url: string) => ({
      en: enRegistry.allDocuments.find((document) => document.url === url),
      ru: ruRegistry.allDocuments.find((document) => document.url === url),
    });

    const sample = findDocument("general/authoring/sample");
    const howToWriteDocs = findDocument("general/authoring/how-to-write-docs");

    expect(sample.en).toMatchObject({
      sourcePath: "general/authoring/sample.en.mdx",
      contentLocale: "en",
      isLocaleFallback: false,
    });
    expect(sample.ru).toMatchObject({
      sourcePath: "general/authoring/sample.ru.mdx",
      contentLocale: "ru",
      isLocaleFallback: false,
    });
    expect(howToWriteDocs.en).toMatchObject({
      sourcePath: "general/authoring/how-to-write-docs.en.md",
      contentLocale: "en",
      isLocaleFallback: false,
    });
    expect(howToWriteDocs.ru).toMatchObject({
      sourcePath: "general/authoring/how-to-write-docs.ru.md",
      contentLocale: "ru",
      isLocaleFallback: false,
    });
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
      "glossary"
    );

    expect(response.pages[0]).toMatchObject({
      title: "Glossary",
      href: "/docs/general/glossary",
    });
  });

  it("loads documents-system UI messages for supported locales", async () => {
    const enMessages = await loadMessages("en");
    const ruMessages = await loadMessages("ru");

    expect(enMessages).toHaveProperty("documentsSystem.pages.home.title", "Documentation");
    expect(ruMessages).toHaveProperty("documentsSystem.pages.home.title", "Документация");
    expect(enMessages).toHaveProperty("documentsSystem.ui.search.openLabel", "Search docs");
    expect(ruMessages).toHaveProperty(
      "documentsSystem.ui.search.openLabel",
      "Поиск по документации"
    );
  });

  it("keeps documentation typography aligned with compact application surfaces", async () => {
    const [sidebarSource, pageSource, mdxSource] = await Promise.all([
      readFile("src/features/documents-system/ui/documents-system-sidebar.tsx", "utf8"),
      readFile("src/features/documents-system/ui/page/documents-system-page.tsx", "utf8"),
      readFile("src/features/documents-system/ui/mdx/documents-mdx-components.tsx", "utf8"),
    ]);

    expect(sidebarSource).not.toContain("text-[0.92rem]");
    expect(sidebarSource).not.toContain("text-[0.84rem]");
    expect(pageSource).not.toContain("md:text-4xl");
    expect(pageSource).not.toContain("w-full text-base leading-relaxed");
    expect(mdxSource).not.toContain("text-[22px]");
    expect(mdxSource).not.toContain("text-lg font-semibold");
  });

  it("does not render the global documentation shortcut inside the documentation header", async () => {
    const source = await readFile(
      "src/features/documents-system/ui/documents-system-header.tsx",
      "utf8"
    );

    expect(source).not.toContain("DocumentationRootLink");
  });

  it("indexes the selected locale document title for search", () => {
    const documents = resolveDocumentsSystemRegistryDocuments(
      [
        registryVariant("general/authoring/sample.en.mdx", "en", "Documentation features"),
        registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации"),
      ],
      "en"
    );
    const sourceByPath = new Map([
      ["general/authoring/sample.en.mdx", "## Markdown basics"],
      ["general/authoring/sample.ru.mdx", "## Базовый Markdown"],
    ]);
    const index = buildDocumentsSystemSearchIndexFromDocuments(documents, sourceByPath);

    expect(index.pages[0]).toMatchObject({
      title: "Documentation features",
      href: "/docs/general/authoring/sample",
    });
    expect(index.headings[0]).toMatchObject({
      title: "Markdown basics",
      href: "/docs/general/authoring/sample#markdown-basics",
    });
  });

  it("indexes fallback content when requested locale has no variant", () => {
    const documents = resolveDocumentsSystemRegistryDocuments(
      [registryVariant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
      "en"
    );
    const sourceByPath = new Map([["general/authoring/sample.ru.mdx", "## Базовый Markdown"]]);
    const index = buildDocumentsSystemSearchIndexFromDocuments(documents, sourceByPath);

    expect(index.pages[0]).toMatchObject({
      title: "Возможности документации",
      href: "/docs/general/authoring/sample",
    });
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
