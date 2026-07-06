# Documents Content Localization Design

## Goal

Make `documents-system` content pages available in `en` and `ru` without changing public documentation URLs.

The selected application interface locale controls which content file is rendered. If the requested locale does not have
its own file, the documentation page renders a fallback content file on the same canonical URL and marks the rendered
content language in the UI.

## Scope

In scope:

- Add a locale-aware content registry for all `src/features/documents-system/content/**/*.{md,mdx}` files.
- Keep canonical documentation URLs unchanged.
- Infer document content locale from file names.
- Treat files without a locale suffix as the configured default locale.
- Use `PUBLIC_DEFAULT_LOCALE` as the single server default locale for app UI and documentation content.
- Rename every existing content file under `src/features/documents-system/content` to an explicit `.ru` filename because
  the current content is Russian.
- Add `en` content variants for `src/features/documents-system/content/general/authoring/` in the first implementation.
- Show a language marker only when rendered content falls back to a locale different from the selected UI locale.
- Make localization registry errors fail like broken document links.

Out of scope:

- Locale-prefixed routes such as `/ru/docs/...` or `/en/docs/...`.
- Translating every existing documentation page to English in this change.
- Adding a new documentation-specific default-locale environment variable.
- Localizing document slugs or path segments.

## File Naming

Supported content locales come from the existing app locales: `en` and `ru`.

Examples:

- `content/general/authoring/sample.en.mdx` maps to `/docs/general/authoring/sample` with content locale `en`.
- `content/general/authoring/sample.ru.mdx` maps to `/docs/general/authoring/sample` with content locale `ru`.
- `content/general/authoring/sample.mdx` maps to `/docs/general/authoring/sample` with content locale
  `PUBLIC_DEFAULT_LOCALE`, defaulting to `en`.

Current content migration:

- `content/index.mdx` becomes `content/index.ru.mdx`.
- `content/workspace/index.md` becomes `content/workspace/index.ru.md`.
- `content/general/glossary/index.md` becomes `content/general/glossary/index.ru.md`.
- `content/general/authoring/sample.mdx` becomes `content/general/authoring/sample.ru.mdx`.
- `content/general/authoring/how-to-write-docs.md` becomes
  `content/general/authoring/how-to-write-docs.ru.md`.
- All existing files under `content/history/**` also receive `.ru` before `.md` or `.mdx`.

English variants are added immediately for `general/authoring`. Other sections remain Russian-only for now and render as
fallback content when the selected UI locale is English.

## Registry Model

The registry reads all content files and groups them by canonical document URL. Locale suffixes are removed before URL
normalization.

Each loaded file is a document variant:

- canonical URL, for example `general/authoring/sample`;
- slug derived from the canonical URL;
- source path, for example `general/authoring/sample.ru.mdx`;
- content locale, for example `ru`;
- parsed metadata and body content;
- enriched metadata such as `source`, computed reading time, and edit date.

The public document type should expose enough information for UI and tooling:

- `requestedLocale`: the selected UI locale used for resolution;
- `contentLocale`: the locale of the rendered content file;
- `isLocaleFallback`: `contentLocale !== requestedLocale`;
- `availableLocales`: content locales available for the same canonical URL;
- `sourcePath`: the selected file to import or index.

The registry can still keep all variants internally for validation and future tooling, but existing consumers should use
the locale-resolved document list by default.

## Locale Resolution

For each canonical URL and requested UI locale:

1. Use the variant matching `requestedLocale`, if present.
2. Otherwise use the unsuffixed variant, interpreted as `PUBLIC_DEFAULT_LOCALE`, if present.
3. Otherwise use the variant matching `PUBLIC_DEFAULT_LOCALE`, if present.
4. Otherwise use the first available variant in the stable app locale order: `en`, then `ru`.

`PUBLIC_DEFAULT_LOCALE` is already the app-level server default. Documentation should reuse it and fall back to `en` when
it is missing or invalid.

## Data Flow

The docs layout and pages resolve the current UI locale on the server through a small helper that uses the existing
i18n config/request mechanism and returns an `AppLocale`. They then request a locale-resolved registry.

Consumers use that same resolved registry:

- `/docs` layout builds the sidebar from locale-resolved visible documents.
- `/docs` and `/docs/[...slug]` pages find the selected document by canonical URL.
- `generateMetadata` uses the selected document metadata.
- `generateStaticParams` returns canonical slugs only, never locale-suffixed slugs.
- prev/next navigation uses the selected locale-resolved document list.
- MDX import uses the selected document `sourcePath`.
- link validation uses canonical URLs after locale suffix stripping.
- search indexes only the locale-resolved visible documents, including fallback content when a fallback variant is selected.

The search UI should send the current `useLocale()` value as a `locale` query parameter. The search route validates it
through the app locale resolver and searches the matching locale-resolved index. If the query parameter is absent, the
route uses the same default as the rest of the app. It should not mix both languages for a single request.

## UI Behavior

The language marker appears only when the rendered content is a fallback for the selected interface locale.

Examples:

- UI locale `ru`, selected `sample.ru.mdx`: no marker.
- UI locale `en`, selected `sample.en.mdx`: no marker.
- UI locale `en`, only `sample.ru.mdx` exists: show `RU`.
- UI locale `ru`, only `sample.en.mdx` or unsuffixed default-English `sample.mdx` exists: show `EN`.

The marker belongs in `DocumentsSystemPageMeta`, near existing page metadata, because the fallback state applies to the
page being read. The sidebar should not gain language badges in this iteration; it already carries document status and
production-visibility markers.

Marker text and accessibility labels are ordinary UI strings and must live in
`src/messages/features/documents-system.{locale}.json`.

## Validation And Failure Mode

Localization registry errors must fail like broken links. They should be build-breaking in production and non-local docs
environments, and they should also fail local tests so authors catch mistakes before CI.

Errors:

- one canonical URL has two files for the same content locale, for example `sample.md` with `PUBLIC_DEFAULT_LOCALE=en`
  and `sample.en.mdx`;
- a filename uses an unsupported locale-looking suffix, for example `sample.de.md`;
- a normalized internal link points to a canonical document that does not exist;
- `generateStaticParams` contains locale suffixes in generated slugs;
- requested locale cannot be resolved to a supported app locale.

The error messages should include the conflicting or invalid file paths and the canonical URL.

## Testing

Use TDD for implementation.

Focused coverage:

- filename parsing: canonical URL, content locale, source path, and extension handling;
- registry grouping and resolution for `en`, `ru`, unsuffixed default-locale files, and fallback behavior;
- duplicate locale conflicts for one canonical URL;
- unsupported locale suffixes;
- link validation after locale suffix normalization;
- `generateStaticParams` returns canonical slugs without locale suffixes;
- search uses the requested locale-resolved document list and indexes fallback content when applicable;
- `DocumentsSystemPageMeta` shows `EN` or `RU` only on fallback pages;
- existing documents-system tests continue to assert visible document URLs, broken-link validation, and UI message loading.

Final verification should include focused Jest tests for documents-system, lint, and a production build.

## Rollout

1. Introduce parsing and registry tests before production changes.
2. Add locale-aware registry structures while preserving canonical URLs.
3. Wire layout, pages, metadata, navigation, MDX imports, and search through locale-resolved documents.
4. Add the fallback language marker to page metadata UI.
5. Rename all existing content files to `.ru`.
6. Add English `general/authoring` variants.
7. Run focused tests, lint, and build.

## Open Decisions

There are no open design decisions at this point. Later work can add English variants for the remaining sections without
changing the registry model.
