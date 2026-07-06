import {
  assertValidDocumentsSystemRequestedLocale,
  parseDocumentsSystemContentPath,
  resolveDocumentsSystemDefaultContentLocale,
} from "@features/documents-system/documents-system-locale-tools";

describe("documents system locale tools", () => {
  const previousDefaultLocale = process.env.PUBLIC_DEFAULT_LOCALE;

  afterEach(() => {
    if (previousDefaultLocale === undefined) {
      delete process.env.PUBLIC_DEFAULT_LOCALE;
    } else {
      process.env.PUBLIC_DEFAULT_LOCALE = previousDefaultLocale;
    }
  });

  it("parses explicit locale filenames into canonical URLs", () => {
    expect(
      parseDocumentsSystemContentPath("content/general/authoring/sample.ru.mdx")
    ).toMatchObject({
      sourcePath: "general/authoring/sample.ru.mdx",
      canonicalSourcePath: "general/authoring/sample.mdx",
      canonicalUrl: "general/authoring/sample",
      contentLocale: "ru",
      explicitLocale: "ru",
      hasExplicitLocale: true,
    });
  });

  it("keeps index canonical URLs stable after locale suffix removal", () => {
    expect(parseDocumentsSystemContentPath("content/index.ru.mdx")).toMatchObject({
      sourcePath: "index.ru.mdx",
      canonicalSourcePath: "index.mdx",
      canonicalUrl: "index",
      contentLocale: "ru",
    });
    expect(parseDocumentsSystemContentPath("content/workspace/index.ru.md")).toMatchObject({
      sourcePath: "workspace/index.ru.md",
      canonicalSourcePath: "workspace/index.md",
      canonicalUrl: "workspace",
      contentLocale: "ru",
    });
  });

  it("treats unsuffixed files as PUBLIC_DEFAULT_LOCALE with en fallback", () => {
    delete process.env.PUBLIC_DEFAULT_LOCALE;

    expect(parseDocumentsSystemContentPath("content/general/glossary/index.md")).toMatchObject({
      sourcePath: "general/glossary/index.md",
      canonicalSourcePath: "general/glossary/index.md",
      canonicalUrl: "general/glossary",
      contentLocale: "en",
      hasExplicitLocale: false,
    });

    process.env.PUBLIC_DEFAULT_LOCALE = "ru";

    expect(parseDocumentsSystemContentPath("content/general/glossary/index.md")).toMatchObject({
      contentLocale: "ru",
      hasExplicitLocale: false,
    });
  });

  it("rejects unsupported locale-looking filename suffixes", () => {
    expect(() => parseDocumentsSystemContentPath("content/general/sample.de.md")).toThrow(
      "Unsupported documents-system content locale"
    );
  });

  it("resolves invalid requested locale through an explicit failure path", () => {
    expect(assertValidDocumentsSystemRequestedLocale("en")).toBe("en");
    expect(assertValidDocumentsSystemRequestedLocale("ru")).toBe("ru");
    expect(() => assertValidDocumentsSystemRequestedLocale("de")).toThrow(
      "Unsupported documents-system requested locale"
    );
  });

  it("uses PUBLIC_DEFAULT_LOCALE as the default content locale", () => {
    process.env.PUBLIC_DEFAULT_LOCALE = "ru";
    expect(resolveDocumentsSystemDefaultContentLocale()).toBe("ru");

    process.env.PUBLIC_DEFAULT_LOCALE = "de";
    expect(resolveDocumentsSystemDefaultContentLocale()).toBe("en");

    process.env.PUBLIC_DEFAULT_LOCALE = "";
    expect(resolveDocumentsSystemDefaultContentLocale()).toBe("en");
  });
});
