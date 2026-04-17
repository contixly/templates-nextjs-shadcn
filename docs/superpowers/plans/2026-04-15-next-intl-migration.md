# next-intl Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the template from direct JSON message imports to `next-intl`, first with a stable default locale and
then with locale-aware routing integrated into the existing auth proxy, while splitting messages into shared `common`
and feature-scoped dictionaries.

**Architecture:** Use a two-phase migration to reduce risk. Phase 1 introduces `next-intl` request config, message
loading, and provider wiring while keeping existing URLs unchanged. Phase 2 adds locale routing, locale negotiation in
`proxy.ts`, localized navigation, and locale-aware metadata without breaking the current protected/public route model.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, `next-intl`, Jest, Better Auth, feature-slice
architecture.

---

## Target File Map

**Create:**

- `src/lib/i18n/config.ts` - Supported locales, default locale, locale type guards.
- `src/i18n/request.ts` - `next-intl` request config and message loader.
- `src/i18n/routing.ts` - `next-intl` routing config for locale-aware navigation.
- `src/i18n/navigation.ts` - Locale-preserving navigation helpers.
- `src/messages/common.en.json` - Shared app-wide messages.
- `src/messages/common.ru.json` - Shared app-wide messages for the second locale.
- `src/messages/features/accounts.en.json` - Feature-scoped messages for accounts pages and UI.
- `src/messages/features/accounts.ru.json` - Feature-scoped messages for accounts pages and UI.
- `src/messages/features/workspaces.en.json` - Feature-scoped messages for workspaces pages and UI.
- `src/messages/features/workspaces.ru.json` - Feature-scoped messages for workspaces pages and UI.
- `src/messages/features/application.en.json` - Feature-scoped messages for application shell and landing UI.
- `src/messages/features/application.ru.json` - Feature-scoped messages for application shell and landing UI.
- `src/components/application/i18n/locale-provider.tsx` - `NextIntlClientProvider` wrapper if needed for composition.
- `src/components/application/i18n/locale-switcher.tsx` - Locale switcher UI for public/protected shells.
- `test/i18n/request.test.ts` - Message loader and locale validation tests.
- `test/i18n/proxy-locale.test.ts` - Proxy locale negotiation and redirect tests.

**Modify:**

- `package.json` - Add `next-intl`.
- `next.config.ts` - Wrap config with `next-intl/plugin`.
- `src/app/layout.tsx` - Phase 1 provider wiring or redirect shell.
- `src/app/(public)/(home)/layout.tsx` - Add locale awareness if needed during transition.
- `src/app/(protected)/layout.tsx` - Ensure locale context is available in protected pages.
- `src/proxy.ts` - Merge auth logic with locale negotiation and locale prefix handling.
- `src/features/routes.ts` - Make route matchers locale-aware without breaking public/protected classification.
- `src/lib/metadata.ts` - Localize metadata defaults, `openGraph.locale`, alternates.
- `src/components/errors/not-found.tsx`
- `src/components/errors/not-authorized.tsx`
- `src/components/errors/not-logged.tsx`
- `src/components/errors/common-error.tsx`
- `src/app/global-error.tsx`
- `src/features/accounts/components/forms/profile-form.tsx`
- `src/features/workspaces/components/forms/workspace-create-dialog.tsx`
- `src/features/workspaces/components/forms/workspace-delete-dialog.tsx`
- `src/features/workspaces/components/forms/workspace-settings-dialog.tsx`
- `src/features/accounts/components/user-dangerous-zone.tsx`
- `src/features/accounts/components/forms/account-delete-dialog.tsx`

**Likely route structure change in Phase 2:**

- Move special files and route groups under `src/app/[locale]/...`

## Migration Rules

- Keep the existing auth flow working at every checkpoint.
- Do not localize pathnames until locale context and navigation APIs are already stable.
- Split messages into two layers:
  - `common` for truly shared verbs, nouns, time units, and generic error copy.
  - `features/*` for page titles, feature-specific forms, dialogs, and UI strings.
- Store files in this layout:
  - `src/messages/common.en.json`
  - `src/messages/common.ru.json`
  - `src/messages/features/<feature>.en.json`
  - `src/messages/features/<feature>.ru.json`
- Use this feature file schema consistently:

```json
{
  "FEATURE_NAME": {
    "pages": {
      "PAGE_NAME": {
        "title": "",
        "description": ""
      }
    },
    "ui": {
      "COMPONENT_NAME": {}
    }
  }
}
```

- Keep message keys stable during migration where practical, but move feature-owned copy out of `common` instead of
  preserving an overly broad shared namespace.
- Prefer server-side translation APIs in RSC and server actions; use hooks only in client components.
- Treat `en` as the bootstrap locale and `ru` as the first non-default locale for validation.

---

### Task 1: Prepare the dependency and migration baseline

**Files:**

- Modify: `package.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Add the dependency**

Run:

```bash
npm install next-intl
```

Expected: `package.json` and lockfile include `next-intl`.

- [ ] **Step 2: Wrap the Next.js config with the plugin**

Implement:

```ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    // existing config
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Verify the app still boots**

Run:

```bash
npm run lint
```

Expected: no new config/type errors from the plugin wrapper.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "chore: add next-intl baseline"
```

---

### Task 2: Introduce the core i18n module

**Files:**

- Create: `src/lib/i18n/config.ts`
- Create: `src/i18n/request.ts`
- Create: `src/messages/common.en.json`
- Create: `src/messages/common.ru.json`
- Create: `src/messages/features/accounts.en.json`
- Create: `src/messages/features/accounts.ru.json`
- Create: `src/messages/features/workspaces.en.json`
- Create: `src/messages/features/workspaces.ru.json`
- Create: `src/messages/features/application.en.json`
- Create: `src/messages/features/application.ru.json`
- Modify: `src/messages/common.json` during extraction or delete it after migration
- Test: `test/i18n/request.test.ts`

- [ ] **Step 1: Define locale primitives**

Implement in `src/lib/i18n/config.ts`:

```ts
export const locales = [ "en", "ru" ] as const;
export type AppLocale = (typeof locales)[number];
export const DefaultLocale: AppLocale = "en";

export function isAppLocale(value: string): value is AppLocale {
    return locales.includes(value as AppLocale);
}
```

- [ ] **Step 2: Split current shared and feature messages**

Move only generic shared strings into:

```text
src/messages/common.en.json
```

Create feature dictionaries with the required schema. Example for accounts:

```json
{
  "accounts": {
    "pages": {
      "profile": {
        "title": "",
        "description": ""
      }
    },
    "ui": {
      "profileForm": {
        "submit": "",
        "namePlaceholder": "",
        "nameHint": "",
        "success": "",
        "errorTitle": "",
        "unknownError": ""
      }
    }
  }
}
```

Apply the same structure to `workspaces` and `application`, then create matching locale files:

- `src/messages/features/accounts.en.json`
- `src/messages/features/accounts.ru.json`
- `src/messages/features/workspaces.en.json`
- `src/messages/features/workspaces.ru.json`
- `src/messages/features/application.en.json`
- `src/messages/features/application.ru.json`

- [ ] **Step 3: Implement request config**

Implement in `src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { DefaultLocale, isAppLocale } from "@lib/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = requested && isAppLocale(requested) ? requested : DefaultLocale;

    return {
        locale,
        messages: {
            common: (await import(`../messages/common.${locale}.json`)).default,
            accounts: (await import(`../messages/features/accounts.${locale}.json`)).default,
            workspaces: (await import(`../messages/features/workspaces.${locale}.json`)).default,
            application: (await import(`../messages/features/application.${locale}.json`)).default,
        },
    };
});
```

- [ ] **Step 4: Test locale validation and message loading**

Write `test/i18n/request.test.ts` for:

- fallback to `en` on unknown locale
- successful load for `en`
- successful load for `ru`
- stable `common` namespace shape
- stable feature namespace shape for `accounts`, `workspaces`, and `application`

Run:

```bash
npm run test -- --testPathPattern=test/i18n/request.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/config.ts src/i18n/request.ts src/messages test/i18n/request.test.ts
git commit -m "feat: add next-intl request configuration"
```

---

### Task 3: Wire `next-intl` into the root layout without changing URLs yet

**Files:**

- Modify: `src/app/layout.tsx`
- Create: `src/components/application/i18n/locale-provider.tsx`
- Modify: `src/components/application/app-providers.tsx`

- [ ] **Step 1: Create a thin locale provider**

Implement:

```tsx
"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

export function LocaleProvider({
                                   children,
                                   locale,
                                   messages,
                               }: {
    children: ReactNode;
    locale: string;
    messages: Record<string, unknown>;
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
```

- [ ] **Step 2: Load locale/messages in `src/app/layout.tsx`**

Use `getLocale` and `getMessages` from `next-intl/server` so the provider is attached at the root and existing route
groups continue to work before locale routing is introduced.

- [ ] **Step 3: Keep `<html lang>` locale-aware**

Replace:

```tsx
<html lang="en" ...>
```

with:

```tsx
<html lang={locale} ...>
```

- [ ] **Step 4: Smoke-test the app**

Run:

```bash
npm run lint
npm run build
```

Expected: root layout compiles and current routes still render on the default locale.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/application/app-providers.tsx src/components/application/i18n/locale-provider.tsx
git commit -m "feat: wire next-intl into app layout"
```

---

### Task 4: Migrate direct JSON imports to `next-intl` APIs

**Files:**

- Modify: `src/components/errors/not-found.tsx`
- Modify: `src/components/errors/not-authorized.tsx`
- Modify: `src/components/errors/not-logged.tsx`
- Modify: `src/components/errors/common-error.tsx`
- Modify: `src/app/global-error.tsx`
- Modify: `src/features/accounts/components/forms/profile-form.tsx`
- Modify: `src/features/workspaces/components/forms/workspace-create-dialog.tsx`
- Modify: `src/features/workspaces/components/forms/workspace-delete-dialog.tsx`
- Modify: `src/features/workspaces/components/forms/workspace-settings-dialog.tsx`
- Modify: `src/features/accounts/components/user-dangerous-zone.tsx`
- Modify: `src/features/accounts/components/forms/account-delete-dialog.tsx`

- [ ] **Step 1: Convert server components to `getTranslations`**

Pattern:

```tsx
import { getTranslations } from "next-intl/server";

export default async function Component() {
    const t = await getTranslations("common");
    return <span>{t("errors.notFound.title")}</span>;
}
```

- [ ] **Step 2: Convert client components to `useTranslations`**

Pattern for `src/features/accounts/components/forms/profile-form.tsx`:

```tsx
import { useTranslations } from "next-intl";

const tCommon = useTranslations("common");
const tAccounts = useTranslations("accounts.accounts.ui.profileForm");

<Button>{tCommon("words.verbs.save")}</Button>
<Input placeholder={tAccounts("namePlaceholder")} />
```

- [ ] **Step 3: Move feature-owned strings into feature dictionaries**

Examples to move into `accounts.accounts.ui.profileForm`:

- `"Profile updated successfully"`
- `"Update Profile"`
- `"Unknown error"`
- `"Enter your display name"`
- `"Maximum 50 characters"`

Move workspace dialog strings into `workspaces.workspaces.ui.*`.

Leave only truly shared strings in `common`.

- [ ] **Step 4: Verify no direct message JSON imports remain in app code**

Run:

```bash
rg -n '@messages/|src/messages/.+\\.json' src
```

Expected: no results outside the central i18n loader.

- [ ] **Step 5: Run focused tests and lint**

Run:

```bash
npm run lint
npm run test -- --testPathPattern=accounts|workspaces
```

Expected: PASS for touched areas.

- [ ] **Step 6: Commit**

```bash
git add src/app/global-error.tsx src/components/errors src/features/accounts src/features/workspaces
git commit -m "refactor: migrate shared UI copy to next-intl"
```

---

### Task 5: Make server-side metadata and formatting locale-aware

**Files:**

- Modify: `src/lib/metadata.ts`
- Modify: `src/lib/pages.ts`
- Modify: route-level metadata files under `src/app/**/opengraph-image.tsx`, `twitter-image.ts`, `layout.tsx`,
  `page.tsx` as needed

- [ ] **Step 1: Localize metadata defaults**

Introduce locale-aware metadata helpers that can read translations for titles, descriptions, and `openGraph.locale`.

- [ ] **Step 2: Keep existing `buildMetadata(page, params)` API stable**

Add locale as an optional argument instead of forcing a wide signature change on every page immediately.

- [ ] **Step 3: Verify default metadata still renders**

Run:

```bash
npm run build
```

Expected: metadata generation passes without runtime i18n errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/metadata.ts src/lib/pages.ts src/app
git commit -m "feat: localize metadata helpers"
```

---

### Task 6: Introduce locale routing configuration

**Files:**

- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Modify: `src/features/routes.ts`

- [ ] **Step 1: Define routing config**

Implement:

```ts
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { DefaultLocale, locales } from "@lib/i18n/config";

export const routing = defineRouting({
    locales,
    DefaultLocale,
    localePrefix: "always"
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
```

- [ ] **Step 2: Decide route policy**

Use:

- locale-prefixed public routes: `/en`, `/ru`, `/en/auth/login`
- locale-prefixed protected routes: `/en/dashboard`, `/ru/dashboard`

This keeps auth and content behavior consistent and avoids a split model.

- [ ] **Step 3: Update route classification**

Make `routesConfig.publicRoutes`, `publicApiRoute`, and protected matchers aware of an optional locale prefix so
`proxy.ts` can still classify requests correctly.

- [ ] **Step 4: Add tests for matcher compatibility**

Cover:

- `/en`
- `/ru/auth/login`
- `/en/api/auth/...`
- `/ru/dashboard`

- [ ] **Step 5: Commit**

```bash
git add src/i18n/routing.ts src/i18n/navigation.ts src/features/routes.ts test/i18n
git commit -m "feat: add locale-aware routing configuration"
```

---

### Task 7: Merge locale negotiation into the auth proxy

**Files:**

- Modify: `src/proxy.ts`
- Test: `test/i18n/proxy-locale.test.ts`

- [ ] **Step 1: Preserve current auth branching**

Keep this order intact:

1. bypass static files
2. load session
3. allow public routes and public APIs
4. enforce protected APIs
5. enforce protected pages

- [ ] **Step 2: Add locale detection before page handling**

Use `Accept-Language` negotiation only when the path has no locale prefix. If the path already starts with `/en` or
`/ru`, do not redirect.

- [ ] **Step 3: Redirect bare paths to localized paths**

Examples:

- `/` -> `/en` or `/ru`
- `/auth/login` -> `/{locale}/auth/login`
- `/dashboard` -> `/{locale}/dashboard`

Do not rewrite API routes.

- [ ] **Step 4: Preserve safe redirect behavior**

When redirecting unauthenticated users to login, keep the localized target in the redirect query:

```text
/en/auth/login?redirect=%2Fen%2Fdashboard
```

- [ ] **Step 5: Test proxy behavior**

Write tests for:

- locale redirect on bare public page
- no redirect on already-prefixed path
- protected page redirect keeps locale
- protected API still returns `401`
- OG bots bypass still works on localized paths

Run:

```bash
npm run test -- --testPathPattern=test/i18n/proxy-locale.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/proxy.ts test/i18n/proxy-locale.test.ts
git commit -m "feat: add locale negotiation to proxy"
```

---

### Task 8: Restructure the App Router under `[locale]`

**Files:**

- Move: `src/app/(public)` -> `src/app/[locale]/(public)`
- Move: `src/app/(protected)` -> `src/app/[locale]/(protected)`
- Move: special files as needed to locale-aware positions
- Modify: `src/app/layout.tsx`
- Create or modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create locale segment layout**

Implement:

```tsx
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}
```

- [ ] **Step 2: Move route groups under `[locale]`**

Do the directory move in one commit so imports and route params can be updated consistently.

- [ ] **Step 3: Narrow locale params**

Validate locale params with the app locale guard and call `notFound()` on invalid values.

- [ ] **Step 4: Re-test critical routes**

Run:

```bash
npm run build
```

Then manually verify:

- `/en`
- `/ru`
- `/en/auth/login`
- `/en/dashboard`

- [ ] **Step 5: Commit**

```bash
git add src/app
git commit -m "refactor: move app routes under locale segment"
```

---

### Task 9: Add locale-preserving navigation and switcher UX

**Files:**

- Create: `src/components/application/i18n/locale-switcher.tsx`
- Modify: `src/components/application/app-site-header.tsx`
- Modify: `src/components/application/navigation/nav-main.tsx`
- Modify: route links that currently use plain `next/link`

- [ ] **Step 1: Replace locale-sensitive links with `src/i18n/navigation.ts` APIs**

This prevents dropping the locale during navigation.

- [ ] **Step 2: Add a locale switcher**

Support switching between `en` and `ru` on the current pathname.

- [ ] **Step 3: Verify navigation preserves auth UX**

Check:

- locale switch from login page
- locale switch from protected dashboard
- breadcrumbs/sidebar links preserve locale

- [ ] **Step 4: Commit**

```bash
git add src/components/application src/i18n
git commit -m "feat: add locale-preserving navigation"
```

---

### Task 10: Finish, clean up, and verify end-to-end

**Files:**

- Delete: `src/messages/common.json` if still present
- Update: docs or README if the template documents route structure

- [ ] **Step 1: Remove dead imports and obsolete files**

Run:

```bash
rg -n 'common.json|@messages/' src
```

Expected: only locale-scoped message imports remain in the i18n loader.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected: all pass.

- [ ] **Step 3: Manual acceptance**

Verify:

- unauthenticated redirect keeps locale
- protected routes render under both locales
- metadata `<html lang>` changes by locale
- shared buttons/errors/forms render translated copy

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete next-intl migration"
```

---

## Risks and Decisions to Hold Constant

- Do not mix direct JSON imports and `next-intl` APIs beyond the migration window.
- Do not localize route slugs in the first pass; keep pathname translation for a later ADR.
- Keep API routes locale-agnostic; only page routes participate in locale prefixes.
- Preserve the existing public/protected route contract in `src/proxy.ts` during every step.

## Acceptance Criteria

- All existing direct `common.json` imports are removed.
- The app renders with `next-intl` under a default locale before route restructuring.
- Locale-prefixed routes work for both public and protected pages.
- Auth redirects and public/protected API behavior remain correct after locale routing.
- Lint, tests, and production build all pass.
