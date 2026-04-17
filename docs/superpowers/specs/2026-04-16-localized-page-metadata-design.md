# Localized Page Metadata Design

## Summary

This design moves page metadata out of static route descriptions and into feature message files, while keeping route objects as the source of truth for navigation and structure.

The selected approach is:

- `PageDescription` becomes a structural route blueprint only.
- `Page` stores i18n namespace information, not resolved strings.
- page metadata switches from static `metadata` exports to `generateMetadata`.
- `buildPageMetadata(page, params?)` resolves `title`, `description`, and Open Graph strings from `next-intl` at metadata-generation time.
- client and server route consumers that currently read `page.title` / `page.description` move to page translation helpers.

This matches the project constraint that locale is fixed at startup, but it does not require route assembly to resolve localized strings up front.

## Goals

- Remove hardcoded page metadata strings from route files.
- Keep feature message files as the source of truth for page copy and metadata copy.
- Preserve route objects as the source of truth for path structure, hierarchy, icons, and page behavior flags.
- Localize page metadata and Open Graph metadata through `next-intl`.
- Avoid storing final translated strings in `Page`.
- Make breadcrumbs and navigation labels resolve through the same page namespace model.

## Non-Goals

- Runtime locale switching.
- Localizing all global metadata in this change.
- Redesigning the full metadata OG chrome in `src/lib/metadata-og.tsx`.
- Introducing build-time code generation for route metadata.

## Current Problem

Today `buildFeature` copies static strings from route files into final `Page` objects:

- `title`
- `description`
- `openGraph.title`
- `openGraph.description`

`buildMetadata(page)` then consumes those final strings directly.

This causes three problems:

1. Route files contain user-facing copy.
2. Page metadata does not come from localization messages.
3. Route consumers such as breadcrumbs and navigation rely on `page.title`, so static metadata strings leak into UI concerns too.

## Chosen Design

### 1. Route files become structural blueprints

`PageDescription` will no longer contain localized string values.

It keeps only structural route data:

- `pathTemplate`
- `parent`
- `selfParent`
- `icon`
- `hidePageHeader`
- `hidePageHeaderOnMobile`
- `breadcrumbs`

The route definitions in files like:

- `src/features/accounts/accounts-routes.ts`
- `src/features/application/application-routes.ts`
- `src/features/workspaces/workspaces-routes.ts`
- `src/features/dashboard/dashboard-routes.ts`

will stop declaring:

- `title`
- `description`
- `openGraph`

### 2. `Page` stores i18n namespace metadata

Final `Page` objects assembled by `buildFeature` will include i18n route metadata keys rather than resolved strings.

Recommended final shape:

```ts
interface Page extends PageDescription {
  readonly path: (matches?: PathMatchesRecord) => string;
  readonly featureName: string;
  readonly pageKey: string;
  readonly i18n: {
    readonly namespace: string;
  };
  readonly parent?: Page;
}
```

Example namespace:

- `accounts.pages.login`
- `accounts.pages.profile`
- `application.pages.home`
- `workspaces.pages.workspaces`

`Page` does not store resolved `title` or `description`.
It also does not store redundant leaf keys such as `titleKey` or `openGraphTitleKey`.
Helpers derive those by convention from `page.i18n.namespace`.

### 3. `parent` becomes a page key

`parent` in `PageDescription` changes from object reference to page-key reference:

```ts
profile: {
  parent: "user",
  pathTemplate: "/user/profile"
}
```

This lets `buildFeature` perform a second pass and connect parent references to final `Page` objects instead of raw blueprint objects.

This removes the current coupling where breadcrumb titles depend on parent route objects carrying static strings.

### 4. Metadata moves to `generateMetadata`

Pages that currently export:

```ts
export const metadata: Metadata = buildMetadata(routes.accounts.pages.login);
```

will switch to:

```ts
export async function generateMetadata() {
  return buildPageMetadata(routes.accounts.pages.login);
}
```

`buildMetadata(page)` is replaced by an async resolver:

```ts
export async function buildPageMetadata(
  page: Page,
  params?: PathMatchesRecord
): Promise<Metadata>
```

This helper:

1. calls `getTranslations(page.i18n.namespace)`
2. resolves:
   - `title` from `title`
   - `description` from `description`
   - `openGraph.title` from `openGraph.title`, falling back to `title`
   - `openGraph.description` from `openGraph.description`, falling back to `description`
3. preserves existing global metadata defaults and URL handling

This design aligns with Next.js metadata guidance for metadata that depends on server-side information or async resolution.

Leaf paths are derived implicitly:

- `title`
- `description`
- `openGraph.title`
- `openGraph.description`

This keeps `Page` minimal while preserving a single namespace-based convention.

## Localization Schema

Page metadata keys live inside the existing feature `pages` namespace.

Example:

```json
{
  "pages": {
    "login": {
      "title": "Sign In",
      "description": "Sign in with Google or GitHub.",
      "openGraph": {
        "title": "Sign In",
        "description": "Access the application securely."
      }
    }
  }
}
```

This keeps page UI copy and page metadata copy in the same page namespace.

The design intentionally avoids introducing a separate `meta` namespace at this stage.

## Open Graph Image Flow

`buildMetadataOGImage` remains a renderer that accepts already resolved `Metadata`.

Open Graph image routes will switch from:

```ts
buildMetadataOGImage(buildMetadata(page), page.featureName)
```

to:

```ts
const metadata = await buildPageMetadata(page, params);
return buildMetadataOGImage(metadata, page.featureName);
```

This keeps OG image rendering decoupled from localization lookup.

It does not yet localize the static OG chrome strings in `src/lib/metadata-og.tsx` such as:

- `TEMPLATE`
- `Build on a neutral foundation`
- `example.com`

Those can be addressed in a follow-up change.

## UI Consumer Changes

Because `Page` no longer exposes final `title` / `description` strings, UI consumers need page translation helpers.

Recommended helpers:

- client:
  - `usePageTranslations(page)`
  - or smaller helpers like `usePageTitle(page)` and `usePageDescription(page)`
- server:
  - `getPageTranslations(page)`

These helpers resolve translations from `page.i18n.namespace`.

### Consumers that need migration

- `src/components/application/breadcrumbs/app-breadcrumbs-routes.tsx`
- `src/components/application/breadcrumbs/app-breadcrumbs-page.tsx`
- `src/components/application/breadcrumbs/app-breadcrumbs-home.tsx`
- `src/features/accounts/components/nav/nav-user.tsx`

These currently read `page.title`, `page.description`, or `page.parent?.title` directly.

After migration they should resolve display strings through the page translation helpers.

## Why This Design

This design was chosen over two alternatives:

### Rejected: build-time generated localized route metadata registry

Pros:

- `buildMetadata` could remain synchronous
- `Page` could contain final strings

Cons:

- adds a generation pipeline and generated files
- duplicates information that can be resolved from `next-intl`
- keeps route assembly coupled to resolved locale strings

### Rejected: resolving translations directly inside `buildFeature`

Pros:

- simple conceptual model if `Page` should hold final strings

Cons:

- `buildFeature` is used in shared route modules imported by client code
- pulling `getTranslations` or server-only message resolution into route assembly is a poor fit
- pushes async/server concerns into route-object construction

The selected design keeps route objects lightweight, shared, and structural, while allowing metadata and UI layers to resolve strings where they are actually rendered.

## Type and API Changes

### `src/types/pages.ts`

Changes:

- remove `title`, `description`, and `openGraph` from `PageDescription`
- change `parent?: PageDescription` to `parent?: T`
- add `pageKey` and `i18n` fields to `Page`

### `src/lib/pages.ts`

Changes:

- `buildFeature` computes `pageKey`
- `buildFeature` computes `i18n.namespace`
- `buildFeature` performs a second pass to resolve `parent` into `Page`

### `src/lib/metadata.ts`

Changes:

- replace `buildMetadata(page, params?)` with `buildPageMetadata(page, params?)`
- `buildPageMetadata` becomes async and uses `getTranslations`
- retain global Open Graph / Twitter defaults

## Migration Plan

1. Update page types in `src/types/pages.ts`.
2. Refactor `buildFeature` in `src/lib/pages.ts`.
3. Replace static metadata exports with `generateMetadata` in page files.
4. Update OG image routes to await localized metadata.
5. Introduce `usePageTranslations` and `getPageTranslations`.
6. Migrate breadcrumbs and route-based navigation consumers.
7. Remove metadata strings from route files.
8. Move all route metadata content into feature message files.

## Validation Rules

- `buildFeature` throws if `parent` references an unknown page key.
- `buildPageMetadata` throws with a clear error if a page namespace is missing `title`.
- `description` and `openGraph.*` remain optional, with fallback rules handled in metadata resolution.

## Testing Strategy

### Unit tests

- `buildFeature` assembles `pageKey`, `i18n.namespace`, and localized parent references correctly.
- `buildPageMetadata` resolves metadata fields and Open Graph fallbacks correctly.
- page translation helpers resolve title/description correctly from route objects.

### Integration checks

- route-based breadcrumbs render translated parent and current page labels
- route-based navigation labels render through page translation helpers

### Verification

- `npm run build`
- targeted Jest tests for route assembly and page metadata helpers

## Risks

- Breadcrumb and nav consumers currently assume `page.title` is always present; partial migration would break these flows.
- Metadata migration touches many page entry files because `metadata` exports become `generateMetadata`.
- If page namespaces drift from route keys, metadata resolution failures may only surface at build time unless explicitly tested.

## Open Follow-Up Work

This design intentionally leaves these for later:

- localization of global metadata in `src/lib/metadata.ts`
- localization of OG chrome strings in `src/lib/metadata-og.tsx`
- possible tightening of message typing for page namespaces and required metadata keys
