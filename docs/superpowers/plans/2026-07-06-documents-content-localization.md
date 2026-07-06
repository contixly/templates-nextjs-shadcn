# Documents Content Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `documents-system` pages from `en` or `ru` content files on stable canonical `/docs/...` URLs, with fallback language markers.

**Architecture:** Add a locale parser and a locale-aware registry layer that groups physical content files into canonical document variants. Pages, layout, search, link validation, static params, and MDX imports consume locale-resolved `DocumentInfo` objects, so existing UI surfaces stay mostly unchanged. Current Russian content is renamed to explicit `.ru` files, and `general/authoring` gets immediate `.en` variants.

**Tech Stack:** Next.js App Router, React Server Components, `next-intl`, MDX, Jest, TypeScript, existing `documents-system` feature slice.

---

## Starting Context

Approved design: `docs/superpowers/specs/2026-07-06-documents-content-localization-design.md`.

Current dirty tree contains pre-existing staged/modified content files. During execution, never stage by broad `git add .`. Use explicit path lists in each commit step and preserve unrelated existing staged state.

Before coding, re-read the relevant local Next.js docs because `AGENTS.md` requires it for Next.js work:

```bash
sed -n '1,240p' node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
```

## File Structure

- Create `src/features/documents-system/documents-system-locale-tools.ts`
  - Parse content file names.
  - Infer explicit and default content locale.
  - Normalize canonical source paths and canonical document URLs.
  - Resolve requested UI locales.
  - Format registry validation errors.

- Modify `src/features/documents-system/documents-system-types.ts`
  - Add document variant and locale metadata fields.
  - Extend `DocumentInfo` with `requestedLocale`, `contentLocale`, `isLocaleFallback`, and `availableLocales`.

- Modify `src/features/documents-system/documents-system-tools.ts`
  - Make URL normalization accept locale-suffixed filenames by delegating to locale tools.
  - Keep sidebar, navigation, sorting, and visibility behavior unchanged.

- Modify `src/features/documents-system/documents-system-actions.ts`
  - Load variants from physical files.
  - Group variants by canonical URL.
  - Validate duplicate/unsupported locale cases.
  - Resolve locale-specific registry views.
  - Cache registry/search inputs by locale.

- Modify `src/features/documents-system/documents-system-link-tools.ts`
  - Validate links from all physical variants against canonical target documents.
  - Preserve existing broken-link failure behavior.

- Modify `src/features/documents-system/documents-system-search-tools.ts`
  - Build and cache indexes per locale.
  - Index selected fallback content when fallback is used.

- Modify `src/features/documents-system/ui/documents-system-search.tsx`
  - Send `locale` query param using `useLocale()`.

- Modify `src/app/api/v1/documents-system/search/route.ts`
  - Validate `locale` query param through app locale resolver.
  - Pass locale to `searchDocumentsSystem`.

- Modify docs App Router files:
  - `src/app/(public)/(documents-system)/layout.tsx`
  - `src/app/(public)/(documents-system)/docs/page.tsx`
  - `src/app/(public)/(documents-system)/docs/[...slug]/page.tsx`
  - `src/app/(public)/(documents-system)/docs/og/[...slug]/route.ts`
  - `src/app/(public)/(documents-system)/docs/opengraph-image.tsx`
  - `src/app/(public)/(documents-system)/docs/twitter-image.ts`

- Modify `src/features/documents-system/ui/page/documents-system-page-meta.tsx`
  - Add fallback language marker.

- Modify messages:
  - `src/messages/features/documents-system.en.json`
  - `src/messages/features/documents-system.ru.json`

- Modify tests:
  - `test/features/documents-system/documents-system.test.ts`
  - Add `test/features/documents-system/documents-system-locale-tools.test.ts`
  - Add or update focused component/search tests as described below.

- Rename content files under `src/features/documents-system/content/**/*.md(x)` to explicit `.ru`.
- Add English content files in `src/features/documents-system/content/general/authoring/`.

---

### Task 1: Locale Filename Parser

**Files:**
- Create: `src/features/documents-system/documents-system-locale-tools.ts`
- Test: `test/features/documents-system/documents-system-locale-tools.test.ts`
- Modify: `src/features/documents-system/documents-system-types.ts`

- [ ] **Step 1: Write failing parser tests**

Create `test/features/documents-system/documents-system-locale-tools.test.ts`:

```ts
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
  });
});
```

- [ ] **Step 2: Run the parser test to verify RED**

Run:

```bash
npm run test -- --testPathPatterns=documents-system-locale-tools
```

Expected: FAIL because `documents-system-locale-tools.ts` does not exist.

- [ ] **Step 3: Add locale types to documents-system types**

Modify `src/features/documents-system/documents-system-types.ts`:

```ts
import type { AppLocale } from "@/src/i18n/config";
```

Add these exported types before `DocumentInfo`:

```ts
export type DocumentsSystemContentLocale = AppLocale;

export type DocumentsSystemParsedContentPath = {
  sourcePath: string;
  canonicalSourcePath: string;
  canonicalUrl: string;
  contentLocale: DocumentsSystemContentLocale;
  explicitLocale?: DocumentsSystemContentLocale;
  hasExplicitLocale: boolean;
};

export type DocumentsSystemDocumentVariant = {
  url: string;
  slug: string[];
  sourcePath: string;
  canonicalSourcePath: string;
  contentLocale: DocumentsSystemContentLocale;
  hasExplicitLocale: boolean;
  meta: DocumentsSystemMetadata;
};
```

Extend `DocumentInfo`:

```ts
export type DocumentInfo = {
  url: string;
  slug: string[];
  sourcePath: string;
  canonicalSourcePath: string;
  requestedLocale: AppLocale;
  contentLocale: DocumentsSystemContentLocale;
  isLocaleFallback: boolean;
  availableLocales: DocumentsSystemContentLocale[];
  meta: DocumentsSystemMetadata;
};
```

- [ ] **Step 4: Implement the locale parser**

Create `src/features/documents-system/documents-system-locale-tools.ts`:

```ts
import { AppLocale, DefaultLocale, isAppLocale, locales, resolveAppLocale } from "@/src/i18n/config";
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

  if (rawLocale && !isAppLocale(rawLocale)) {
    throw new Error(
      `Unsupported documents-system content locale "${rawLocale}" in ${sourcePath}. Supported locales: ${locales.join(", ")}`
    );
  }

  const contentLocale = rawLocale ?? resolveDocumentsSystemDefaultContentLocale();
  const canonicalSourcePath = rawLocale
    ? sourcePath.replace(LOCALE_SUFFIX_PATTERN, "$2")
    : sourcePath;
  const canonicalUrl = normalizeDocumentUrlFromCanonicalSourcePath(canonicalSourcePath);

  return {
    sourcePath,
    canonicalSourcePath,
    canonicalUrl,
    contentLocale,
    ...(rawLocale ? { explicitLocale: rawLocale } : {}),
    hasExplicitLocale: Boolean(rawLocale),
  };
};
```

- [ ] **Step 5: Run parser test to verify GREEN**

Run:

```bash
npm run test -- --testPathPatterns=documents-system-locale-tools
```

Expected: PASS.

- [ ] **Step 6: Commit parser task**

Run with exact paths:

```bash
git add src/features/documents-system/documents-system-locale-tools.ts \
  src/features/documents-system/documents-system-types.ts \
  test/features/documents-system/documents-system-locale-tools.test.ts
git commit -m "feat: parse localized document content paths"
```

---

### Task 2: Locale-Aware Registry Resolution

**Files:**
- Modify: `src/features/documents-system/documents-system-actions.ts`
- Modify: `src/features/documents-system/documents-system-tools.ts`
- Modify: `src/features/documents-system/documents-system-types.ts`
- Test: `test/features/documents-system/documents-system.test.ts`

- [ ] **Step 1: Add failing registry tests**

Append to `test/features/documents-system/documents-system.test.ts`:

```ts
import { resolveDocumentsSystemRegistryDocuments } from "@features/documents-system/documents-system-actions";
import type {
  DocumentsSystemDocumentVariant,
  DocumentsSystemMetadata,
} from "@features/documents-system/documents-system-types";

const baseMeta = (title: string): DocumentsSystemMetadata => ({
  title,
  description: `${title} description`,
  group: "Group",
  parentItem: "Parent",
  order: 10,
  status: "published",
  toc: true,
});

const variant = (
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
  meta: baseMeta(title),
});

it("resolves requested locale variants by canonical URL", () => {
  const documents = resolveDocumentsSystemRegistryDocuments(
    [
      variant("general/authoring/sample.en.mdx", "en", "Sample"),
      variant("general/authoring/sample.ru.mdx", "ru", "Возможности документации"),
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
    [variant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
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
  expect(() =>
    resolveDocumentsSystemRegistryDocuments(
      [
        variant("general/authoring/sample.mdx", "en", "Sample"),
        variant("general/authoring/sample.en.mdx", "en", "Sample duplicate"),
      ],
      "en"
    )
  ).toThrow("Duplicate documents-system content locale");
});
```

- [ ] **Step 2: Run registry tests to verify RED**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: FAIL because `resolveDocumentsSystemRegistryDocuments` is not exported.

- [ ] **Step 3: Update URL normalization to strip locale suffixes**

Modify `src/features/documents-system/documents-system-tools.ts`.

Add import:

```ts
import { parseDocumentsSystemContentPath } from "./documents-system-locale-tools";
```

Replace `normalizeDocumentUrl` with:

```ts
normalizeDocumentUrl: (filePath: string) => parseDocumentsSystemContentPath(filePath).canonicalUrl,
```

Change `sortDocuments` to accept both resolved documents and physical variants:

```ts
sortDocuments: <TDocument extends { meta: DocumentsSystemMetadata }>(documents: TDocument[]) => {
```

Keep the function body unchanged and return `TDocument[]`.

- [ ] **Step 4: Implement registry grouping and resolution**

Modify `src/features/documents-system/documents-system-actions.ts`.

Import `AppLocale`, `locales`, and parser types:

```ts
import { AppLocale, locales, resolveAppLocale } from "@/src/i18n/config";
import { parseDocumentsSystemContentPath } from "./documents-system-locale-tools";
```

Update imports from `documents-system-types`:

```ts
import {
  CACHE_DocumentsSystemTag,
  DocumentInfo,
  DocumentModule,
  DocumentsSystemDocumentVariant,
  DocumentsSystemLinkIndex,
  DocumentsSystemMetadata,
} from "./documents-system-types";
```

Update `DocumentsSystemRegistry`:

```ts
export type DocumentsSystemRegistry = {
  allDocuments: DocumentInfo[];
  visibleDocuments: DocumentInfo[];
  allVariants: DocumentsSystemDocumentVariant[];
  sourceByPath: Map<string, string>;
  linkIndex: DocumentsSystemLinkIndex;
  locale: AppLocale;
};
```

Add helpers above `readDocumentFiles`:

```ts
const sortLocales = (values: Iterable<AppLocale>) =>
  [...values].sort((left, right) => locales.indexOf(left) - locales.indexOf(right));

const findPreferredVariant = (
  variants: DocumentsSystemDocumentVariant[],
  requestedLocale: AppLocale
) => {
  const defaultLocale = resolveAppLocale();

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
```

Change `readDocumentFiles` return type to variants:

```ts
const readDocumentFiles = async (): Promise<{
  variants: DocumentsSystemDocumentVariant[];
  sourceByPath: Map<string, string>;
}> => {
```

Inside file map, replace source/url construction with:

```ts
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
```

At the end of `readDocumentFiles`, return sorted variants:

```ts
const sortedVariants = documentsSystemTools.sortDocuments(
  loaded.filter((document): document is DocumentsSystemDocumentVariant => Boolean(document))
);

return {
  variants: sortedVariants,
  sourceByPath,
};
```

Change `buildDocumentsSystemRegistry` signature:

```ts
const buildDocumentsSystemRegistry = async (
  locale: AppLocale = resolveAppLocale()
): Promise<DocumentsSystemRegistry> => {
```

Inside it:

```ts
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
```

Replace single registry caches with maps:

```ts
const allDocumentsByLocale = new Map<AppLocale, DocumentInfo[]>();
const visibleDocumentsByLocale = new Map<AppLocale, DocumentInfo[]>();
const documentsLinkIndexByLocale = new Map<AppLocale, DocumentsSystemLinkIndex>();
const documentsRegistryByLocale = new Map<AppLocale, DocumentsSystemRegistry>();
```

Update cache assignment:

```ts
const assignDocumentsSystemRegistryCache = (registry: DocumentsSystemRegistry) => {
  allDocumentsByLocale.set(registry.locale, registry.allDocuments);
  visibleDocumentsByLocale.set(registry.locale, registry.visibleDocuments);
  documentsSourceByPath = registry.sourceByPath;
  documentsLinkIndexByLocale.set(registry.locale, registry.linkIndex);
  documentsRegistryByLocale.set(registry.locale, registry);
};
```

Update public loaders to accept locale:

```ts
export async function loadDocumentsSystemRegistry(
  locale: AppLocale = resolveAppLocale()
): Promise<DocumentsSystemRegistry> {
  if (shouldCacheDocuments && documentsRegistryByLocale.has(locale)) {
    return documentsRegistryByLocale.get(locale)!;
  }

  const registry = await buildDocumentsSystemRegistry(locale);
  assignDocumentsSystemRegistryCache(registry);

  return registry;
}
```

Mirror the same argument pattern for `loadAllDocuments`, `loadDocuments`, `getDocumentsSystemLinkIndex`, `getCachedDocumentsSystemRegistry`, `getCachedAllDocuments`, `getCachedDocuments`, and `getCachedDocumentsSystemLinkIndex`.

- [ ] **Step 5: Run registry tests to verify GREEN**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: PASS for the existing and new registry tests.

- [ ] **Step 6: Commit registry task**

Run with exact paths:

```bash
git add src/features/documents-system/documents-system-actions.ts \
  src/features/documents-system/documents-system-tools.ts \
  src/features/documents-system/documents-system-types.ts \
  test/features/documents-system/documents-system.test.ts
git commit -m "feat: resolve localized document registry"
```

---

### Task 3: Link Validation And Static Param Guards

**Files:**
- Modify: `src/features/documents-system/documents-system-link-tools.ts`
- Modify: `src/features/documents-system/documents-system-tools.ts`
- Test: `test/features/documents-system/documents-system.test.ts`

- [ ] **Step 1: Add failing tests for link validation and static params**

Append to `test/features/documents-system/documents-system.test.ts`:

```ts
import { buildDocumentsSystemLinkIndex } from "@features/documents-system/documents-system-link-tools";

it("builds link targets from canonical document URLs", () => {
  const registry = resolveDocumentsSystemRegistryDocuments(
    [
      variant("general/authoring/sample.ru.mdx", "ru", "Возможности документации"),
      {
        ...variant("general/authoring/how-to-write-docs.ru.md", "ru", "Как писать документацию"),
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

it("builds static params from canonical slugs without locale suffixes", () => {
  const documents = resolveDocumentsSystemRegistryDocuments(
    [variant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
    "ru"
  );

  expect(documentsSystemTools.buildStaticParams(documents)).toEqual([
    { slug: ["general", "authoring", "sample"] },
  ]);
});
```

- [ ] **Step 2: Run tests to verify RED or guard current behavior**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: If Task 2 implementation already strips locale suffixes correctly, these tests may pass. If they fail, failure should show `.ru` leaking into URLs or params.

- [ ] **Step 3: Update link validation to validate all variants against canonical targets**

Change `validateDocumentsSystemLinks` signature in `src/features/documents-system/documents-system-link-tools.ts`:

```ts
export const validateDocumentsSystemLinks = (
  sourceDocuments: Array<Pick<DocumentInfo, "sourcePath">>,
  sourceByPath: Map<string, string>,
  targetDocuments: DocumentInfo[] = sourceDocuments as DocumentInfo[]
): DocumentsSystemBrokenLink[] => {
  const index = buildDocumentsSystemLinkIndex(targetDocuments);
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
};
```

- [ ] **Step 4: Add static params invariant check**

Modify `documentsSystemTools.buildStaticParams` in `src/features/documents-system/documents-system-tools.ts`:

```ts
buildStaticParams: (documents: DocumentInfo[]) =>
  documents
    .filter((document) => document.url !== "index")
    .map((document) => {
      if (document.slug.some((segment) => /\.(en|ru)$/iu.test(segment))) {
        throw new Error(
          `Documents-system static params must use canonical slugs without locale suffixes: ${document.slug.join("/")}`
        );
      }

      return { slug: document.slug };
    }),
```

- [ ] **Step 5: Run tests to verify GREEN**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: PASS.

- [ ] **Step 6: Commit validation task**

Run with exact paths:

```bash
git add src/features/documents-system/documents-system-link-tools.ts \
  src/features/documents-system/documents-system-tools.ts \
  test/features/documents-system/documents-system.test.ts
git commit -m "test: guard canonical document links and params"
```

---

### Task 4: Wire Locale Into Docs Pages And Search

**Files:**
- Modify: `src/app/(public)/(documents-system)/layout.tsx`
- Modify: `src/app/(public)/(documents-system)/docs/page.tsx`
- Modify: `src/app/(public)/(documents-system)/docs/[...slug]/page.tsx`
- Modify: `src/features/documents-system/ui/documents-system-search.tsx`
- Modify: `src/app/api/v1/documents-system/search/route.ts`
- Modify: `src/features/documents-system/documents-system-search-tools.ts`
- Test: `test/features/documents-system/documents-system.test.ts`

- [ ] **Step 1: Add failing search-locale tests**

Append to `test/features/documents-system/documents-system.test.ts`:

```ts
import { buildDocumentsSystemSearchIndexFromDocuments } from "@features/documents-system/documents-system-search-tools";

it("indexes the selected locale document title for search", async () => {
  const documents = resolveDocumentsSystemRegistryDocuments(
    [
      variant("general/authoring/sample.en.mdx", "en", "Documentation features"),
      variant("general/authoring/sample.ru.mdx", "ru", "Возможности документации"),
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

it("indexes fallback content when requested locale has no variant", async () => {
  const documents = resolveDocumentsSystemRegistryDocuments(
    [variant("general/authoring/sample.ru.mdx", "ru", "Возможности документации")],
    "en"
  );
  const sourceByPath = new Map([["general/authoring/sample.ru.mdx", "## Базовый Markdown"]]);
  const index = buildDocumentsSystemSearchIndexFromDocuments(documents, sourceByPath);

  expect(index.pages[0]).toMatchObject({
    title: "Возможности документации",
    href: "/docs/general/authoring/sample",
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: FAIL because `buildDocumentsSystemSearchIndexFromDocuments` is not exported.

- [ ] **Step 3: Add a pure search-index builder**

In `src/features/documents-system/documents-system-search-tools.ts`, export:

```ts
export const buildDocumentsSystemSearchIndexFromDocuments = (
  documents: DocumentInfo[],
  sourceByPath: Map<string, string>
): DocumentsSystemSearchIndex => {
  const indexedDocuments = documents.map((document, documentOrder) => {
    const href = documentsSystemTools.documentUrlToHref(document.url);
    const source = sourceByPath.get(document.sourcePath) ?? "";

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
  });

  return {
    pages: indexedDocuments.map(({ page }) => page),
    headings: indexedDocuments.flatMap(({ headings }) => headings),
  };
};
```

Then update `buildDocumentsSystemSearchIndex(locale)` to load locale-specific registry and call the pure builder:

```ts
export async function buildDocumentsSystemSearchIndex(
  locale?: AppLocale
): Promise<DocumentsSystemSearchIndex> {
  const registry = await getCachedDocumentsSystemRegistry(locale);

  return buildDocumentsSystemSearchIndexFromDocuments(
    registry.visibleDocuments,
    registry.sourceByPath
  );
}
```

Replace the single cached search index with:

```ts
const cachedSearchIndexes = new Map<AppLocale, DocumentsSystemSearchIndex>();
```

Update `getDocumentsSystemSearchIndex` and `searchDocumentsSystem`:

```ts
export async function getDocumentsSystemSearchIndex(locale: AppLocale = resolveAppLocale()) {
  if (documentsSystemEnvironment !== "local" && cachedSearchIndexes.has(locale)) {
    return cachedSearchIndexes.get(locale)!;
  }

  const index = await buildDocumentsSystemSearchIndex(locale);

  if (documentsSystemEnvironment !== "local") {
    cachedSearchIndexes.set(locale, index);
  }

  return index;
}

export async function searchDocumentsSystem(query: string, locale: AppLocale = resolveAppLocale()) {
  return searchDocumentsSystemIndex(await getDocumentsSystemSearchIndex(locale), query);
}
```

Add imports:

```ts
import { AppLocale, resolveAppLocale } from "@/src/i18n/config";
import type { DocumentInfo } from "@features/documents-system/documents-system-types";
```

- [ ] **Step 4: Pass locale through the search UI and API route**

Modify `src/features/documents-system/ui/documents-system-search.tsx`.

Change import:

```ts
import { useLocale, useTranslations } from "next-intl";
```

Change search path helper:

```ts
const getSearchApiPath = (query: string, locale: string) =>
  routes.api.search({ query: { q: query, locale } });
```

Inside component:

```ts
const locale = useLocale();
```

Change fetch call:

```ts
fetch(getSearchApiPath(debouncedQuery, locale), {
```

Add `locale` to effect dependencies:

```ts
}, [debouncedQuery, locale, open]);
```

Modify `src/app/api/v1/documents-system/search/route.ts`.

Add import:

```ts
import { resolveAppLocale } from "@/src/i18n/config";
```

Add helper:

```ts
const getSearchLocale = (request: NextRequest | Request) =>
  resolveAppLocale(new URL(request.url).searchParams.get("locale"));
```

Change route:

```ts
const locale = getSearchLocale(request);

try {
  return NextResponse.json(await searchDocumentsSystem(query, locale), { headers: cacheHeaders });
```

- [ ] **Step 5: Pass locale into docs layout and pages**

In `src/app/(public)/(documents-system)/layout.tsx`, import:

```ts
import { resolveAppLocale } from "@/src/i18n/config";
```

Use locale:

```ts
const locale = resolveAppLocale();
const documents = await getCachedDocuments(locale);
```

In `src/app/(public)/(documents-system)/docs/page.tsx` and `src/app/(public)/(documents-system)/docs/[...slug]/page.tsx`, import `resolveAppLocale`, then use:

```ts
const locale = resolveAppLocale();
const registry = await getCachedDocumentsSystemRegistry(locale);
```

Apply the same pattern in `generateMetadata`.

- [ ] **Step 6: Update OG and Twitter routes if they load document registry**

Inspect:

```bash
sed -n '1,220p' src/app/'(public)'/'(documents-system)'/docs/og/'[...slug]'/route.ts
sed -n '1,220p' src/app/'(public)'/'(documents-system)'/docs/opengraph-image.tsx
sed -n '1,220p' src/app/'(public)'/'(documents-system)'/docs/twitter-image.ts
```

For any file that calls `getCachedDocumentsSystemRegistry()` or `getCachedDocuments()`, add:

```ts
import { resolveAppLocale } from "@/src/i18n/config";

const locale = resolveAppLocale();
const registry = await getCachedDocumentsSystemRegistry(locale);
```

- [ ] **Step 7: Run tests to verify GREEN**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: PASS.

- [ ] **Step 8: Commit wiring task**

Run with exact paths:

```bash
git add src/features/documents-system/documents-system-search-tools.ts \
  src/features/documents-system/ui/documents-system-search.tsx \
  src/app/api/v1/documents-system/search/route.ts \
  src/app/'(public)'/'(documents-system)'/layout.tsx \
  src/app/'(public)'/'(documents-system)'/docs/page.tsx \
  src/app/'(public)'/'(documents-system)'/docs/'[...slug]'/page.tsx \
  src/app/'(public)'/'(documents-system)'/docs/og/'[...slug]'/route.ts \
  src/app/'(public)'/'(documents-system)'/docs/opengraph-image.tsx \
  src/app/'(public)'/'(documents-system)'/docs/twitter-image.ts \
  test/features/documents-system/documents-system.test.ts
git commit -m "feat: load documentation content by locale"
```

---

### Task 5: Fallback Language Marker UI

**Files:**
- Modify: `src/features/documents-system/ui/page/documents-system-page-meta.tsx`
- Modify: `src/messages/features/documents-system.en.json`
- Modify: `src/messages/features/documents-system.ru.json`
- Test: `test/localization/localized-runtime-components.test.tsx` or add `test/features/documents-system/documents-system-page-meta.test.tsx`

- [ ] **Step 1: Write failing marker component test**

Create `test/features/documents-system/documents-system-page-meta.test.tsx`:

```tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DocumentsSystemPageMeta } from "@features/documents-system/ui/page/documents-system-page-meta";
import type { DocumentsSystemMetadata } from "@features/documents-system/documents-system-types";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    const labels: Record<string, string> = {
      "documentsSystem.ui.page.meta.section": "Section",
      "documentsSystem.ui.page.meta.contentLanguage": "Content language",
      "documentsSystem.ui.page.meta.fallbackLanguage": `Available in ${values?.locale ?? ""}`,
      "documentsSystem.ui.page.status.published": "Published",
    };

    return labels[`${namespace}.${key}`] ?? key;
  },
}));

const meta: DocumentsSystemMetadata = {
  title: "Sample",
  description: "Sample description",
  group: "General",
  parentItem: "Authoring",
  order: 10,
  status: "published",
  toc: true,
};

describe("DocumentsSystemPageMeta", () => {
  it("shows a language marker for fallback content", () => {
    render(
      <DocumentsSystemPageMeta
        meta={meta}
        statusTone="default"
        contentLocale="ru"
        isLocaleFallback
      />
    );

    expect(screen.getByText("Content language")).toBeInTheDocument();
    expect(screen.getByText("Available in RU")).toBeInTheDocument();
  });

  it("does not show a language marker when selected content matches the UI locale", () => {
    render(
      <DocumentsSystemPageMeta
        meta={meta}
        statusTone="default"
        contentLocale="en"
        isLocaleFallback={false}
      />
    );

    expect(screen.queryByText("Content language")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run marker test to verify RED**

Run:

```bash
npm run test -- --testPathPatterns=documents-system-page-meta
```

Expected: FAIL because `DocumentsSystemPageMeta` does not accept `contentLocale` and `isLocaleFallback`.

- [ ] **Step 3: Add message keys**

Modify `src/messages/features/documents-system.en.json` under `ui.page.meta`:

```json
"contentLanguage": "Content language",
"fallbackLanguage": "Available in {locale}"
```

Modify `src/messages/features/documents-system.ru.json` under `ui.page.meta`:

```json
"contentLanguage": "Язык страницы",
"fallbackLanguage": "Доступно на {locale}"
```

- [ ] **Step 4: Add props and marker rendering**

Modify `src/features/documents-system/ui/page/documents-system-page-meta.tsx`.

Import `IconLanguage`:

```ts
import {
  IconClock,
  IconEdit,
  IconEyeOff,
  IconFolder,
  IconGitBranch,
  IconLanguage,
  IconTarget,
  IconUser,
} from "@tabler/icons-react";
```

Add props:

```ts
contentLocale?: string;
isLocaleFallback?: boolean;
```

Use them in function parameters:

```ts
export const DocumentsSystemPageMeta = ({
  meta,
  statusTone,
  hiddenInProduction = false,
  contentLocale,
  isLocaleFallback = false,
}: {
  meta: DocumentsSystemMetadata;
  statusTone: DocumentsSystemStatusTone;
  hiddenInProduction?: boolean;
  contentLocale?: string;
  isLocaleFallback?: boolean;
}) => {
```

Before status item:

```ts
if (isLocaleFallback && contentLocale) {
  const markerLocale = contentLocale.toUpperCase();

  secondaryMetaItems.push(
    <MetaItem
      key="content-language"
      icon={<IconLanguage size={14} />}
      label={tMeta("contentLanguage")}
      tone={statusTone}
      valueClassName="whitespace-normal break-words"
    >
      {tMeta("fallbackLanguage", { locale: markerLocale })}
    </MetaItem>
  );
}
```

- [ ] **Step 5: Pass marker props from page wrapper**

Modify `src/features/documents-system/ui/page/documents-system-page.tsx`:

```tsx
<DocumentsSystemPageMeta
  meta={meta}
  statusTone={statusTone}
  hiddenInProduction={hiddenInProduction}
  contentLocale={document.contentLocale}
  isLocaleFallback={document.isLocaleFallback}
/>
```

- [ ] **Step 6: Run marker test to verify GREEN**

Run:

```bash
npm run test -- --testPathPatterns=documents-system-page-meta
```

Expected: PASS.

- [ ] **Step 7: Run localization consumer tests**

Run:

```bash
npm run test -- --testPathPatterns=page-translation-consumers
```

Expected: PASS.

- [ ] **Step 8: Commit UI marker task**

Run with exact paths:

```bash
git add src/features/documents-system/ui/page/documents-system-page-meta.tsx \
  src/features/documents-system/ui/page/documents-system-page.tsx \
  src/messages/features/documents-system.en.json \
  src/messages/features/documents-system.ru.json \
  test/features/documents-system/documents-system-page-meta.test.tsx
git commit -m "feat: mark fallback document content language"
```

---

### Task 6: Content File Migration

**Files:**
- Rename: `src/features/documents-system/content/**/*.md`
- Rename: `src/features/documents-system/content/**/*.mdx`
- Create: `src/features/documents-system/content/general/authoring/sample.en.mdx`
- Create: `src/features/documents-system/content/general/authoring/how-to-write-docs.en.md`
- Test: `test/features/documents-system/documents-system.test.ts`

- [ ] **Step 1: Write failing registry expectations for localized content files**

Update the visible document URL test in `test/features/documents-system/documents-system.test.ts` so it asserts canonical URLs and fallback metadata after `.ru` migration:

```ts
it("loads visible public documents as canonical URLs without locale suffixes", async () => {
  const registry = await loadDocumentsSystemRegistry("en");

  expect(registry.visibleDocuments.map((document) => document.url)).toEqual([
    "index",
    "general/glossary",
    "workspace",
    "history/change-logs",
    "history/change-logs/2026-03-23-weekly-changelog",
    "history/releases",
    "history/releases/2.0.11",
  ]);
  expect(registry.visibleDocuments.every((document) => !document.url.endsWith(".ru"))).toBe(true);
  expect(registry.visibleDocuments.some((document) => document.isLocaleFallback)).toBe(true);
  expect(validateDocumentsSystemLinks(registry.allVariants, registry.sourceByPath, registry.allDocuments)).toEqual([]);
});
```

Add authoring local-only expectations because `authoring` pages are hidden in production but loaded in local mode:

```ts
it("loads authoring pages from matching english and russian variants", async () => {
  const enRegistry = await loadDocumentsSystemRegistry("en");
  const ruRegistry = await loadDocumentsSystemRegistry("ru");

  const enSample = enRegistry.allDocuments.find(
    (document) => document.url === "general/authoring/sample"
  );
  const ruSample = ruRegistry.allDocuments.find(
    (document) => document.url === "general/authoring/sample"
  );

  expect(enSample).toMatchObject({
    sourcePath: "general/authoring/sample.en.mdx",
    contentLocale: "en",
    isLocaleFallback: false,
  });
  expect(ruSample).toMatchObject({
    sourcePath: "general/authoring/sample.ru.mdx",
    contentLocale: "ru",
    isLocaleFallback: false,
  });
});
```

- [ ] **Step 2: Run tests to verify RED before migration**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: FAIL because content files still have unsuffixed names and English authoring variants do not exist.

- [ ] **Step 3: Rename existing content files to `.ru`**

Use `git mv` for tracked files so history is preserved:

```bash
git mv src/features/documents-system/content/index.mdx src/features/documents-system/content/index.ru.mdx
git mv src/features/documents-system/content/workspace/index.md src/features/documents-system/content/workspace/index.ru.md
git mv src/features/documents-system/content/general/glossary/index.md src/features/documents-system/content/general/glossary/index.ru.md
git mv src/features/documents-system/content/general/authoring/sample.mdx src/features/documents-system/content/general/authoring/sample.ru.mdx
git mv src/features/documents-system/content/general/authoring/how-to-write-docs.md src/features/documents-system/content/general/authoring/how-to-write-docs.ru.md
git mv src/features/documents-system/content/history/change-logs/index.md src/features/documents-system/content/history/change-logs/index.ru.md
git mv src/features/documents-system/content/history/change-logs/2026-03-23-weekly-changelog.md src/features/documents-system/content/history/change-logs/2026-03-23-weekly-changelog.ru.md
git mv src/features/documents-system/content/history/releases/index.md src/features/documents-system/content/history/releases/index.ru.md
git mv src/features/documents-system/content/history/releases/2.0.11.mdx src/features/documents-system/content/history/releases/2.0.11.ru.mdx
```

If any `git mv` fails because the file is currently added rather than tracked, use `mv` for that file and stage the delete/add pair explicitly in the commit step.

- [ ] **Step 4: Add English authoring content**

Create `src/features/documents-system/content/general/authoring/how-to-write-docs.en.md`:

```md
---
title: "How to write documentation"
description: "Rules for structure, metadata, and public documentation content"
group: "General"
groupOrder: 700
parentItem: "Introduction"
order: 20
status: "published"
hide: true
toc: true
author: "Molchanov N."
version: "1.0.1"
editedAt: "2026-06-01"
---

# How to write documentation

A document should describe one clear behavior, module, or user scenario. If a page starts mixing independent topics, split it into smaller child documents.

## Metadata

Every page starts with metadata:

```md
---
title: "Page title"
description: "Short description for headers and SEO"
group: "Events Program"
parentItem: "Voting Panel"
order: 10
status: "draft"
toc: true
---
```

`group` controls the top-level section in the left menu. `parentItem` groups child pages inside that section. `order` controls the page position. `status: "draft"` and `status: "review"` are hidden in production, and `hide: true` hides the page in production for every status.

Set `editedAt` manually in `YYYY-MM-DD` format for pages that will be published or archived.

## Recommended page structure

Use a stable order:

1. A short description of the scenario or module.
2. When and for whom the page is useful.
3. Main concepts and roles.
4. Step-by-step behavior or rules.
5. Limits, errors, and edge cases.
6. Related pages or components.

## Headings and anchors

The right table of contents is built from second-level headings. Main page sections should start with `##`. Use third-level headings only inside long sections.

## MDX components

Plain Markdown is enough for most pages. If a page needs an interactive or highlighted block, convert it to MDX and use shared components:

- `Callout` for important notes, warnings, or limits.
- `Steps` and `Step` for step-by-step instructions.
- `Files`, `Folder`, and `File` for file or module structure.
- `Tabs` for switching between description, example, and code.

## Links to code

If a document describes a specific module, point to real paths:

- route in `src/app`;
- feature in `src/features`;
- shared component in `src/components`;
- tests in `test`.

This reduces drift and makes it clear where to verify the described behavior.
```

Create `src/features/documents-system/content/general/authoring/sample.en.mdx` by translating the current Russian sample page. Keep the same MDX component coverage and image paths. Use this frontmatter:

```mdx
---
title: "Documentation features"
description: "Example page with basic Markdown and documentation-specific components"
group: "General"
groupOrder: 700
parentItem: "Introduction"
order: 10
status: "published"
hide: true
toc: true
purpose: "Content authors"
author: "Molchanov N."
version: "1.0.0"
editedAt: "2026-07-06"
---
```

Then translate the existing body section-by-section into English while preserving:

- headings structure;
- `Callout`, `Steps`, `Step`, `Files`, `Folder`, `File`, `Tabs`, and `Tab` examples;
- image paths;
- code fences;
- footnote IDs.

- [ ] **Step 5: Run documents-system tests to verify GREEN**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
```

Expected: PASS.

- [ ] **Step 6: Commit content migration task**

Run with exact paths. Include all renamed content files and the test file:

```bash
git add src/features/documents-system/content/index.ru.mdx \
  src/features/documents-system/content/workspace/index.ru.md \
  src/features/documents-system/content/general/glossary/index.ru.md \
  src/features/documents-system/content/general/authoring/sample.ru.mdx \
  src/features/documents-system/content/general/authoring/sample.en.mdx \
  src/features/documents-system/content/general/authoring/how-to-write-docs.ru.md \
  src/features/documents-system/content/general/authoring/how-to-write-docs.en.md \
  src/features/documents-system/content/history/change-logs/index.ru.md \
  src/features/documents-system/content/history/change-logs/2026-03-23-weekly-changelog.ru.md \
  src/features/documents-system/content/history/releases/index.ru.md \
  src/features/documents-system/content/history/releases/2.0.11.ru.mdx \
  test/features/documents-system/documents-system.test.ts
git add -u src/features/documents-system/content
git commit -m "docs: localize documentation content filenames"
```

---

### Task 7: Final Verification

**Files:**
- Verify only; no planned source edits unless a command exposes a real defect.

- [ ] **Step 1: Run focused Jest suites**

Run:

```bash
npm run test -- --testPathPatterns=documents-system
npm run test -- --testPathPatterns=documents-system-locale-tools
npm run test -- --testPathPatterns=documents-system-page-meta
npm run test -- --testPathPatterns=page-translation-consumers
```

Expected: all suites pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0. If the existing React Compiler warning in `src/features/dashboard/ui/template/data-table.tsx:436` still appears, record it as unrelated.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit code 0. If existing sharp/libvips duplicate-class warnings appear, record them as unrelated if the build succeeds.

- [ ] **Step 4: Run HTTP sanity checks against local dev server**

If a dev server is already running on `http://localhost:3000`, use it. Otherwise start one with:

```bash
npm run dev
```

Check canonical routes:

```bash
node <<'NODE'
const paths = [
  "/docs",
  "/docs/general/authoring/sample",
  "/docs/general/authoring/how-to-write-docs"
];

for (const path of paths) {
  const response = await fetch(`http://localhost:3000${path}`);
  const html = await response.text();
  console.log(`${path} status=${response.status} hasRuSuffix=${html.includes(".ru.mdx") || html.includes(".ru.md")}`);
}
NODE
```

Expected:

```text
/docs status=200 hasRuSuffix=false
/docs/general/authoring/sample status=200 hasRuSuffix=false
/docs/general/authoring/how-to-write-docs status=200 hasRuSuffix=false
```

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: no whitespace errors. Any remaining uncommitted files should be intentional user changes or the last task's files before commit.

- [ ] **Step 6: Commit verification fixes if needed**

If final verification required small fixes, commit exact paths:

```bash
git add src/features/documents-system/documents-system-actions.ts \
  src/features/documents-system/documents-system-tools.ts \
  src/features/documents-system/documents-system-link-tools.ts \
  src/features/documents-system/documents-system-search-tools.ts \
  src/features/documents-system/ui/page/documents-system-page-meta.tsx \
  test/features/documents-system/documents-system.test.ts
git commit -m "fix: stabilize localized documentation content"
```

Use only the paths that actually changed during verification. If no fixes were needed, do not create an empty commit.
