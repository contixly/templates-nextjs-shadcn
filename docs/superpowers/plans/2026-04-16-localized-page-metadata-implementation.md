# Localized Page Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move route metadata out of route definitions into localized messages, switch pages to `generateMetadata`, and make route-based UI resolve labels from page i18n namespaces instead of static `page.title` strings.

**Architecture:** Route files become structural blueprints only. `buildFeature` assembles `Page` objects with `pageKey`, `parent` references, and a page namespace like `accounts.pages.login`. Metadata is resolved asynchronously via `buildPageMetadata(page, params?)`, while breadcrumbs, document headers, and route-driven navigation read page labels through dedicated translation helpers.

**Tech Stack:** Next.js 16 App Router, `next-intl`, TypeScript, Jest, React Testing Library

---

## File Structure

### Route model and assembly

- Modify: `src/types/pages.ts`
- Modify: `src/lib/pages.ts`
- Test: `test/lib/pages.test.ts`

### Metadata and page translation helpers

- Modify: `src/lib/metadata.ts`
- Create: `src/lib/page-translations.ts`
- Create: `src/hooks/use-page-translations.ts`
- Test: `test/lib/metadata.test.ts`

### Route blueprints and feature messages

- Modify: `src/features/accounts/accounts-routes.ts`
- Modify: `src/features/application/application-routes.ts`
- Modify: `src/features/workspaces/workspaces-routes.ts`
- Modify: `src/features/dashboard/dashboard-routes.ts`
- Modify: `src/messages/features/accounts.en.json`
- Modify: `src/messages/features/accounts.ru.json`
- Modify: `src/messages/features/application.en.json`
- Modify: `src/messages/features/application.ru.json`
- Modify: `src/messages/features/workspaces.en.json`
- Modify: `src/messages/features/workspaces.ru.json`
- Modify: `src/messages/features/dashboard.en.json`
- Modify: `src/messages/features/dashboard.ru.json`
- Modify: `test/i18n/request.test.ts`

### Page entry points and OG image routes

- Modify: `src/app/(public)/(home)/page.tsx`
- Modify: `src/app/(public)/(simple)/auth/login/page.tsx`
- Modify: `src/app/(public)/(simple)/auth/error/page.tsx`
- Modify: `src/app/(protected)/(global)/dashboard/page.tsx`
- Modify: `src/app/(protected)/(global)/workspaces/page.tsx`
- Modify: `src/app/(protected)/(global)/welcome/page.tsx`
- Modify: `src/app/(protected)/(global)/user/page.tsx`
- Modify: `src/app/(protected)/(global)/user/profile/page.tsx`
- Modify: `src/app/(protected)/(global)/user/connections/page.tsx`
- Modify: `src/app/(protected)/(global)/user/security/page.tsx`
- Modify: `src/app/(protected)/(global)/user/danger/page.tsx`
- Modify: `src/app/(protected)/(global)/[workspaceId]/page.tsx`
- Modify: `src/app/opengraph-image.tsx`
- Modify: `src/app/(public)/(simple)/auth/login/opengraph-image.tsx`
- Modify: `src/app/(public)/(simple)/auth/error/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/dashboard/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/workspaces/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/welcome/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/profile/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/connections/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/security/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/danger/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/[workspaceId]/opengraph-image.tsx`
- Test: `test/app/page-metadata-exports.test.ts`

### Route-driven UI consumers

- Modify: `src/components/application/breadcrumbs/app-breadcrumbs-routes.tsx`
- Modify: `src/components/application/breadcrumbs/app-breadcrumbs-page.tsx`
- Modify: `src/components/application/breadcrumbs/app-breadcrumbs-home.tsx`
- Modify: `src/components/application/document/document-header.tsx`
- Modify: `src/components/application/navigation/nav-secondary.tsx`
- Modify: `src/features/accounts/components/nav/nav-user.tsx`
- Modify: `src/features/accounts/components/nav/nav-user-settings.tsx`
- Modify: `src/lib/ui.ts`
- Test: `test/ui/page-translation-consumers.test.tsx`

---

### Task 1: Refactor `Page` Assembly To Use Blueprint Metadata

**Files:**
- Modify: `src/types/pages.ts`
- Modify: `src/lib/pages.ts`
- Test: `test/lib/pages.test.ts`

- [ ] **Step 1: Write the failing route assembly test**

```ts
import { buildFeature } from "../../src/lib/pages";

describe("buildFeature", () => {
  it("assigns page keys, i18n namespaces, and resolved parent pages", () => {
    const feature = buildFeature("accounts", {
      pages: {
        user: {
          pathTemplate: "/user",
        },
        profile: {
          parent: "user",
          pathTemplate: "/user/profile",
          hidePageHeader: true,
        },
      },
    });

    expect(feature.pages.user.pageKey).toBe("user");
    expect(feature.pages.user.i18n.namespace).toBe("accounts.pages.user");
    expect(feature.pages.profile.pageKey).toBe("profile");
    expect(feature.pages.profile.i18n.namespace).toBe("accounts.pages.profile");
    expect(feature.pages.profile.parent).toBe(feature.pages.user);
    expect(feature.pages.profile.path()).toBe("/user/profile");
  });

  it("throws when parent references an unknown page key", () => {
    expect(() =>
      buildFeature("accounts", {
        pages: {
          profile: {
            parent: "missing",
            pathTemplate: "/user/profile",
          },
        },
      })
    ).toThrow('Unknown parent page "missing" for "accounts.profile"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPatterns='test/lib/pages.test.ts'`

Expected: FAIL because `Page` does not define `pageKey`/`i18n.namespace` and `parent` still expects an object reference.

- [ ] **Step 3: Write the minimal type and assembly implementation**

```ts
// src/types/pages.ts
export type PageDescription<T extends string = string> = Readonly<{
  pathTemplate: string;
  parent?: T;
  selfParent?: boolean;
  icon?: Icon;
  hidePageHeader?: boolean;
  hidePageHeaderOnMobile?: boolean;
  breadcrumbs?: {
    hideBreadcrumbs?: boolean;
    hideTemplateTitle?: boolean;
    hideTemplateDescription?: boolean;
  };
}>;

export type FeatureDescription<T extends string> = Readonly<{
  pages: Record<T, PageDescription<T>>;
}>;

export interface Page extends Omit<PageDescription, "parent"> {
  readonly path: (matches?: PathMatchesRecord) => string;
  readonly featureName: string;
  readonly pageKey: string;
  readonly i18n: {
    readonly namespace: string;
  };
  readonly parent?: Page;
}
```

```ts
// src/lib/pages.ts
const getPages = <T extends string>(
  pages: Record<T, PageDescription<T>>,
  featureName: string
): Record<T, Page> => {
  const assembled = Object.fromEntries(
    Object.entries(pages).map(([pageKey, page]) => [
      pageKey,
      {
        ...page,
        path: (matches?: PathMatchesRecord) => pathBuilder(page.pathTemplate, matches),
        featureName,
        pageKey,
        i18n: {
          namespace: `${featureName}.pages.${pageKey}`,
        },
      },
    ])
  ) as Record<T, Omit<Page, "parent"> & { parent?: T }>;

  return Object.fromEntries(
    Object.entries(assembled).map(([pageKey, page]) => {
      if (!page.parent) return [pageKey, page];

      const parent = assembled[page.parent];
      if (!parent) {
        throw new Error(`Unknown parent page "${page.parent}" for "${featureName}.${pageKey}"`);
      }

      return [pageKey, { ...page, parent }];
    })
  ) as Record<T, Page>;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- --testPathPatterns='test/lib/pages.test.ts'`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/pages.ts src/lib/pages.ts test/lib/pages.test.ts
git commit -m "refactor: add page namespace metadata to route assembly"
```

### Task 2: Add Async Metadata Resolution And Page Translation Helpers

**Files:**
- Modify: `src/lib/metadata.ts`
- Create: `src/lib/page-translations.ts`
- Create: `src/hooks/use-page-translations.ts`
- Test: `test/lib/metadata.test.ts`

- [ ] **Step 1: Write the failing metadata resolver test**

```ts
import { buildPageMetadata } from "../../src/lib/metadata";
import { Page } from "../../src/types/pages";

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(async () => (key: string) => {
    const translations: Record<string, string> = {
      title: "Sign In",
      description: "Sign in with Google or GitHub.",
      "openGraph.title": "Sign In",
      "openGraph.description": "Access the application securely.",
    };

    if (!(key in translations)) {
      throw new Error(`Missing message: ${key}`);
    }

    return translations[key];
  }),
}));

const page = {
  path: () => "/auth/login",
  featureName: "accounts",
  pageKey: "login",
  pathTemplate: "/auth/login",
  i18n: { namespace: "accounts.pages.login" },
} as Page;

describe("buildPageMetadata", () => {
  it("resolves page metadata from next-intl", async () => {
    const metadata = await buildPageMetadata(page);

    expect(metadata.title).toBe("Sign In");
    expect(metadata.description).toBe("Sign in with Google or GitHub.");
    expect(metadata.openGraph?.title).toBe("Sign In");
    expect(metadata.openGraph?.description).toBe("Access the application securely.");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPatterns='test/lib/metadata.test.ts'`

Expected: FAIL because `buildPageMetadata` does not exist.

- [ ] **Step 3: Write the minimal metadata and page translation helpers**

```ts
// src/lib/page-translations.ts
import { getTranslations } from "next-intl/server";
import { Page } from "@typings/pages";

const translateOptional = (t: (key: string) => string, key: string) => {
  try {
    return t(key);
  } catch {
    return undefined;
  }
};

export const getPageTranslations = async (page: Page) => {
  const t = await getTranslations(page.i18n.namespace as never);

  return {
    title: t("title"),
    description: translateOptional(t, "description"),
    openGraphTitle: translateOptional(t, "openGraph.title") ?? t("title"),
    openGraphDescription:
      translateOptional(t, "openGraph.description") ??
      translateOptional(t, "description"),
  };
};
```

```ts
// src/hooks/use-page-translations.ts
"use client";

import { useTranslations } from "next-intl";
import { Page } from "@typings/pages";

const translateOptional = (t: (key: string) => string, key: string) => {
  try {
    return t(key);
  } catch {
    return undefined;
  }
};

export const usePageTranslations = (page: Page) => {
  const t = useTranslations(page.i18n.namespace as never);

  return {
    title: t("title"),
    description: translateOptional(t, "description"),
    openGraphTitle: translateOptional(t, "openGraph.title") ?? t("title"),
    openGraphDescription:
      translateOptional(t, "openGraph.description") ??
      translateOptional(t, "description"),
  };
};
```

```ts
// src/lib/metadata.ts
import { getPageTranslations } from "@lib/page-translations";

export const buildPageMetadata = async (
  page: Page,
  params?: PathMatchesRecord
): Promise<Metadata> => {
  const { title, description, openGraphTitle, openGraphDescription } =
    await getPageTranslations(page);

  return {
    title,
    description,
    openGraph: {
      ...openGraph,
      title: openGraphTitle,
      description: openGraphDescription,
      url: page.path(params),
    },
    twitter: {
      ...twitter,
      title: openGraphTitle,
      description: openGraphDescription,
    },
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- --testPathPatterns='test/lib/metadata.test.ts'`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/metadata.ts src/lib/page-translations.ts src/hooks/use-page-translations.ts test/lib/metadata.test.ts
git commit -m "feat: add localized page metadata resolver"
```

### Task 3: Remove Metadata Strings From Route Files And Move Them To Messages

**Files:**
- Modify: `src/features/accounts/accounts-routes.ts`
- Modify: `src/features/application/application-routes.ts`
- Modify: `src/features/workspaces/workspaces-routes.ts`
- Modify: `src/features/dashboard/dashboard-routes.ts`
- Modify: `src/messages/features/accounts.en.json`
- Modify: `src/messages/features/accounts.ru.json`
- Modify: `src/messages/features/application.en.json`
- Modify: `src/messages/features/application.ru.json`
- Modify: `src/messages/features/workspaces.en.json`
- Modify: `src/messages/features/workspaces.ru.json`
- Modify: `src/messages/features/dashboard.en.json`
- Modify: `src/messages/features/dashboard.ru.json`
- Modify: `test/i18n/request.test.ts`

- [ ] **Step 1: Write the failing message-shape test**

```ts
import { loadI18nMessagesConfig } from "../../src/i18n/messages";

describe("route page metadata messages", () => {
  it("loads page title and open graph strings from feature messages", async () => {
    const config = await loadI18nMessagesConfig("en");

    expect(config.messages.accounts.pages.login.title).toBe("Sign In");
    expect(config.messages.accounts.pages.login.openGraph.title).toBe("Sign In");
    expect(config.messages.application.pages.home.title).toBe("Home");
    expect(config.messages.workspaces.pages.workspaces.title).toBe("Workspaces");
    expect(config.messages.dashboard.pages.application_dashboard.title).toBe("Dashboard");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPatterns='test/i18n/request.test.ts'`

Expected: FAIL because route metadata keys are not present in the feature message files.

- [ ] **Step 3: Move metadata strings into feature messages and simplify route blueprints**

```ts
// src/features/accounts/accounts-routes.ts
const user = {
  pathTemplate: "/user",
  icon: IconUser,
} as const;

const accountsRoutes: AccountsRoutes = buildFeature("accounts", {
  pages: {
    login: {
      pathTemplate: "/auth/login",
      icon: IconLogin,
    },
    error: {
      pathTemplate: "/auth/error",
    },
    user,
    welcome: {
      pathTemplate: "/welcome",
      hidePageHeader: true,
      hidePageHeaderOnMobile: true,
    },
    profile: {
      parent: "user",
      pathTemplate: "/user/profile",
      icon: IconUser,
      hidePageHeader: true,
    },
    connections: {
      parent: "user",
      pathTemplate: "/user/connections",
      icon: IconLink,
      hidePageHeader: true,
    },
    security: {
      parent: "user",
      pathTemplate: "/user/security",
      icon: IconShield,
      hidePageHeader: true,
    },
    danger: {
      parent: "user",
      pathTemplate: "/user/danger",
      icon: IconAlertTriangle,
      hidePageHeader: true,
    },
  },
});
```

```ts
// src/features/application/application-routes.ts
const applicationRoutes: ApplicationRoutes = buildFeature("application", {
  pages: {
    home: {
      pathTemplate: "/",
      icon: IconHome,
    },
  },
});
```

```ts
// src/features/workspaces/workspaces-routes.ts
const workspaceRoutes: WorkspaceRoutes = buildFeature("workspaces", {
  pages: {
    workspaces: {
      pathTemplate: "/workspaces",
      icon: IconTableShare,
      breadcrumbs: {
        hideTemplateDescription: true,
      },
    },
    workspace: {
      pathTemplate: "/workspaces/[workspaceId]",
    },
  },
});
```

```ts
// src/features/dashboard/dashboard-routes.ts
const dashboardRoutes: DashboardRoutes = buildFeature("dashboard", {
  pages: {
    application_dashboard: {
      pathTemplate: "/dashboard",
      hidePageHeader: true,
      hidePageHeaderOnMobile: true,
    },
  },
});
```

```json
// src/messages/features/accounts.en.json
{
  "pages": {
    "login": {
      "title": "Sign In",
      "description": "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
      "openGraph": {
        "title": "Sign In",
        "description": "Access the template application securely with Google or GitHub OAuth."
      }
    }
  }
}
```

```json
// src/messages/features/dashboard.en.json
{
  "pages": {
    "application_dashboard": {
      "title": "Dashboard",
      "description": "Your dashboard — extend this area with summaries and shortcuts for your own workflows.",
      "openGraph": {
        "title": "Dashboard",
        "description": "View your application data and manage core sections in one place."
      }
    }
  }
}
```

Repeat the same shape for:

- `accounts.ru.json`
- `application.en.json`
- `application.ru.json`
- `workspaces.en.json`
- `workspaces.ru.json`
- `dashboard.ru.json`

using the existing English/Russian copy already present in the route files.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- --testPathPatterns='test/i18n/request.test.ts'`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/accounts-routes.ts src/features/application/application-routes.ts src/features/workspaces/workspaces-routes.ts src/features/dashboard/dashboard-routes.ts src/messages/features/accounts.en.json src/messages/features/accounts.ru.json src/messages/features/application.en.json src/messages/features/application.ru.json src/messages/features/workspaces.en.json src/messages/features/workspaces.ru.json src/messages/features/dashboard.en.json src/messages/features/dashboard.ru.json test/i18n/request.test.ts
git commit -m "refactor: move route metadata copy into feature messages"
```

### Task 4: Migrate Pages And OG Routes To `generateMetadata`

**Files:**
- Modify: `src/app/(public)/(home)/page.tsx`
- Modify: `src/app/(public)/(simple)/auth/login/page.tsx`
- Modify: `src/app/(public)/(simple)/auth/error/page.tsx`
- Modify: `src/app/(protected)/(global)/dashboard/page.tsx`
- Modify: `src/app/(protected)/(global)/workspaces/page.tsx`
- Modify: `src/app/(protected)/(global)/welcome/page.tsx`
- Modify: `src/app/(protected)/(global)/user/page.tsx`
- Modify: `src/app/(protected)/(global)/user/profile/page.tsx`
- Modify: `src/app/(protected)/(global)/user/connections/page.tsx`
- Modify: `src/app/(protected)/(global)/user/security/page.tsx`
- Modify: `src/app/(protected)/(global)/user/danger/page.tsx`
- Modify: `src/app/(protected)/(global)/[workspaceId]/page.tsx`
- Modify: `src/app/opengraph-image.tsx`
- Modify: `src/app/(public)/(simple)/auth/login/opengraph-image.tsx`
- Modify: `src/app/(public)/(simple)/auth/error/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/dashboard/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/workspaces/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/welcome/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/profile/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/connections/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/security/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/user/danger/opengraph-image.tsx`
- Modify: `src/app/(protected)/(global)/[workspaceId]/opengraph-image.tsx`
- Test: `test/app/page-metadata-exports.test.ts`

- [ ] **Step 1: Write the failing metadata export test**

```ts
jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Sign In" })),
  SITE_NAME: "Application Template",
}));

describe("login page metadata export", () => {
  it("delegates to buildPageMetadata through generateMetadata", async () => {
    const module = await import("../../src/app/(public)/(simple)/auth/login/page");

    expect(await module.generateMetadata()).toEqual({ title: "Sign In" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPatterns='test/app/page-metadata-exports.test.ts'`

Expected: FAIL because the page still exports static `metadata`.

- [ ] **Step 3: Convert page files and OG routes**

```ts
// src/app/(public)/(simple)/auth/login/page.tsx
import { buildPageMetadata, SITE_NAME } from "@lib/metadata";

export async function generateMetadata() {
  return buildPageMetadata(accountsRoutes.pages.login);
}
```

```ts
// src/app/(protected)/(global)/[workspaceId]/page.tsx
export async function generateMetadata({
  params,
}: PageProps<"/[workspaceId]">): Promise<Metadata> {
  return buildPageMetadata(workspaceRoutes.pages.workspace, await params);
}
```

```ts
// src/app/(protected)/(global)/dashboard/opengraph-image.tsx
const page = dashboardRoutes.pages.application_dashboard;

const opengraphImage = async () => {
  const metadata = await buildPageMetadata(page);
  return buildMetadataOGImage(metadata, page.featureName);
};
```

Apply the same conversion to every page and every `opengraph-image.tsx` route listed in this task.

- [ ] **Step 4: Run the focused test and then a full build**

Run: `npm run test -- --testPathPatterns='test/app/page-metadata-exports.test.ts'`

Expected: PASS

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/(home)/page.tsx src/app/(public)/(simple)/auth/login/page.tsx src/app/(public)/(simple)/auth/error/page.tsx src/app/(protected)/(global)/dashboard/page.tsx src/app/(protected)/(global)/workspaces/page.tsx src/app/(protected)/(global)/welcome/page.tsx src/app/(protected)/(global)/user/page.tsx src/app/(protected)/(global)/user/profile/page.tsx src/app/(protected)/(global)/user/connections/page.tsx src/app/(protected)/(global)/user/security/page.tsx src/app/(protected)/(global)/user/danger/page.tsx src/app/(protected)/(global)/[workspaceId]/page.tsx src/app/opengraph-image.tsx src/app/(public)/(simple)/auth/login/opengraph-image.tsx src/app/(public)/(simple)/auth/error/opengraph-image.tsx src/app/(protected)/(global)/dashboard/opengraph-image.tsx src/app/(protected)/(global)/workspaces/opengraph-image.tsx src/app/(protected)/(global)/welcome/opengraph-image.tsx src/app/(protected)/(global)/user/opengraph-image.tsx src/app/(protected)/(global)/user/profile/opengraph-image.tsx src/app/(protected)/(global)/user/connections/opengraph-image.tsx src/app/(protected)/(global)/user/security/opengraph-image.tsx src/app/(protected)/(global)/user/danger/opengraph-image.tsx src/app/(protected)/(global)/[workspaceId]/opengraph-image.tsx test/app/page-metadata-exports.test.ts
git commit -m "refactor: localize page metadata through generateMetadata"
```

### Task 5: Migrate Breadcrumbs, Document Header, And Route-Driven Menus

**Files:**
- Modify: `src/components/application/breadcrumbs/app-breadcrumbs-routes.tsx`
- Modify: `src/components/application/breadcrumbs/app-breadcrumbs-page.tsx`
- Modify: `src/components/application/breadcrumbs/app-breadcrumbs-home.tsx`
- Modify: `src/components/application/document/document-header.tsx`
- Modify: `src/components/application/navigation/nav-secondary.tsx`
- Modify: `src/features/accounts/components/nav/nav-user.tsx`
- Modify: `src/features/accounts/components/nav/nav-user-settings.tsx`
- Modify: `src/lib/ui.ts`
- Test: `test/ui/page-translation-consumers.test.tsx`

- [ ] **Step 1: Write the failing consumer integration test**

```tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DocumentHeader } from "../../src/components/application/document/document-header";
import { AppBreadcrumbsHome } from "../../src/components/application/breadcrumbs/app-breadcrumbs-home";

jest.mock("../../src/hooks/use-current-page", () => ({
  useCurrentPage: () => ({
    featureName: "application",
    pageKey: "home",
    pathTemplate: "/",
    path: () => "/",
    i18n: { namespace: "application.pages.home" },
  }),
}));

jest.mock("../../src/hooks/use-page-translations", () => ({
  usePageTranslations: () => ({
    title: "Главная",
    description: "Локализованное описание.",
  }),
}));

jest.mock("../../src/components/application/document/document-provider", () => ({
  useDocument: () => ({
    title: null,
    description: null,
    documentActions: null,
    category: null,
  }),
}));

jest.mock("../../src/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("route translation consumers", () => {
  it("renders translated route title and description in the document header", () => {
    render(<DocumentHeader />);

    expect(screen.getByText("Главная")).toBeInTheDocument();
    expect(screen.getByText("Локализованное описание.")).toBeInTheDocument();
  });

  it("renders translated route title in breadcrumbs home", () => {
    render(<AppBreadcrumbsHome />);

    expect(screen.getByText("Главная")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --testPathPatterns='test/ui/page-translation-consumers.test.tsx'`

Expected: FAIL because consumers still read `page.title` and `page.description`.

- [ ] **Step 3: Replace direct route-string access with page translation helpers**

```ts
// src/components/application/document/document-header.tsx
import { usePageTranslations } from "@hooks/use-page-translations";

const translations = currentPage ? usePageTranslations(currentPage) : null;

const description = useMemo(() => {
  if (!currentPage || currentPage.hidePageHeader) return null;
  return (documentDescription ?? translations?.description)?.trim().replace(/\.$/, "");
}, [currentPage, documentDescription, translations?.description]);

<h1 className="text-md font-semibold tracking-tight md:text-2xl">
  {title ?? translations?.title}
</h1>
```

```ts
// src/components/application/breadcrumbs/app-breadcrumbs-routes.tsx
import { usePageTranslations } from "@hooks/use-page-translations";

const currentPageTranslations = usePageTranslations(page);
const parentTranslations = page.parent ? usePageTranslations(page.parent) : null;

<BreadcrumbPage>{parentTranslations?.title ?? currentPageTranslations.title}</BreadcrumbPage>
```

```ts
// src/components/application/breadcrumbs/app-breadcrumbs-home.tsx
const homeTranslations = usePageTranslations(routes.application.pages.home);

<span className="hidden lg:block">{homeTranslations.title}</span>
```

```ts
// src/lib/ui.ts
export const getMenuItem = (
  page: Page,
  label: string,
  params?: PathMatchesRecord
): MenuItem => ({
  label,
  url: page.path(params),
  icon: page.icon,
});
```

```ts
// src/components/application/navigation/nav-secondary.tsx
import { usePageTranslations } from "@hooks/use-page-translations";

const homeTranslations = usePageTranslations(routes.application.pages.home);
const workspacesTranslations = usePageTranslations(routes.workspaces.pages.workspaces);
const profileTranslations = usePageTranslations(routes.accounts.pages.profile);

const items = [
  getMenuItem(routes.application.pages.home, homeTranslations.title),
  getMenuItem(routes.workspaces.pages.workspaces, workspacesTranslations.title),
  getMenuItem(routes.accounts.pages.profile, profileTranslations.title),
  {
    label: t("getHelp"),
    url: APP_BASE_URL,
    icon: IconHelp,
  },
];
```

```ts
// src/features/accounts/components/nav/nav-user-settings.tsx
const profileTranslations = usePageTranslations(routes.accounts.pages.profile);
const connectionsTranslations = usePageTranslations(routes.accounts.pages.connections);
const securityTranslations = usePageTranslations(routes.accounts.pages.security);
const dangerTranslations = usePageTranslations(routes.accounts.pages.danger);

const navItems = [
  getMenuItem(routes.accounts.pages.profile, profileTranslations.title),
  getMenuItem(routes.accounts.pages.connections, connectionsTranslations.title),
  getMenuItem(routes.accounts.pages.security, securityTranslations.title),
  { ...getMenuItem(routes.accounts.pages.danger, dangerTranslations.title), isDanger: true },
];
```

Also apply the same helper usage to:

- `src/components/application/breadcrumbs/app-breadcrumbs-page.tsx`
- `src/features/accounts/components/nav/nav-user.tsx`

- [ ] **Step 4: Run the focused UI test and the full verification set**

Run: `npm run test -- --testPathPatterns='test/ui/page-translation-consumers.test.tsx|test/lib/pages.test.ts|test/lib/metadata.test.ts|test/i18n/request.test.ts|test/app/page-metadata-exports.test.ts'`

Expected: PASS

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/application/breadcrumbs/app-breadcrumbs-routes.tsx src/components/application/breadcrumbs/app-breadcrumbs-page.tsx src/components/application/breadcrumbs/app-breadcrumbs-home.tsx src/components/application/document/document-header.tsx src/components/application/navigation/nav-secondary.tsx src/features/accounts/components/nav/nav-user.tsx src/features/accounts/components/nav/nav-user-settings.tsx src/lib/ui.ts test/ui/page-translation-consumers.test.tsx
git commit -m "refactor: resolve route labels through page translation helpers"
```

## Self-Review

### Spec coverage

- Structural-only route blueprints: covered by Task 1 and Task 3.
- `Page` stores namespace metadata instead of resolved strings: covered by Task 1.
- `parent` becomes a page key: covered by Task 1 and Task 3.
- `generateMetadata` replaces static metadata exports: covered by Task 4.
- `buildPageMetadata(page, params?)`: covered by Task 2.
- OG routes await localized metadata: covered by Task 4.
- Breadcrumbs and route-driven navigation move to translation helpers: covered by Task 5.

### Placeholder scan

- No `TODO`, `TBD`, or deferred “handle later” steps remain.
- Each code-changing step includes concrete code snippets.
- Each verification step includes exact commands and expected outcomes.

### Type consistency

- `PageDescription.parent` is treated as a page key in Task 1 and Task 3.
- `Page.i18n.namespace` is the only stored metadata key in Task 1, Task 2, and Task 5.
- `buildPageMetadata(page, params?)` is consistently named in Task 2 and Task 4.

