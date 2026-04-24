# Settings Shell Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the narrow `max-w-2xl` settings shell with a wider shared rail, then assign explicit `wide` or `readable` width modes to settings-like protected pages and the invitation decision page.

**Architecture:** Introduce a shared settings-shell component in `src/components/application/settings/` so width, outer gutters, and section modes are defined in one place. Migrate the two existing settings layouts to that shell, then wrap individual page routes in explicit `SettingsPageSection` modes so forms stay readable while data-heavy pages use the full `max-w-6xl` rail.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, Tailwind CSS v4, Jest + Testing Library, next-intl

---

## File Map

### Create

- `src/components/application/settings/settings-shell.tsx`
  - Shared shell primitives:
    - `SettingsContentRail`
    - `SettingsPageShell`
    - `SettingsPageSection`
- `test/ui/settings-shell.test.tsx`
  - Unit coverage for the new shell primitives and mode classes
- `test/app/settings-layout-shell.test.tsx`
  - App-level coverage proving the two settings layouts delegate to the shared shell
- `test/app/user-settings-page-width-modes.test.tsx`
  - App-level coverage for `readable` vs `wide` route wrappers in user settings pages

### Modify

- `src/app/(protected)/(global)/user/layout.tsx`
  - Replace inline narrow `<main>` markup with `SettingsPageShell`
- `src/app/(protected)/(global)/[organizationKey]/settings/layout.tsx`
  - Replace inline narrow `<main>` markup with `SettingsPageShell`
- `src/app/(protected)/(global)/user/profile/page.tsx`
  - Wrap `UserProfile` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/user/connections/page.tsx`
  - Wrap `UserConnections` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/user/security/page.tsx`
  - Wrap `UserSessions` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/user/danger/page.tsx`
  - Wrap `UserDangerousZone` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/user/invitations/page.tsx`
  - Wrap `PendingWorkspaceInvitationsBlock` with `SettingsPageSection mode="wide"`
- `src/app/(protected)/(global)/[organizationKey]/settings/workspace/page.tsx`
  - Wrap `WorkspaceSettingsPage` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/[organizationKey]/settings/users/page.tsx`
  - Wrap `WorkspaceSettingsUsersPage` with `SettingsPageSection mode="wide"`
- `src/app/(protected)/(global)/[organizationKey]/settings/invitations/page.tsx`
  - Wrap `WorkspaceSettingsInvitationsPage` with `SettingsPageSection mode="wide"`
- `src/app/(protected)/(global)/[organizationKey]/settings/roles/page.tsx`
  - Wrap `WorkspaceSettingsPlaceholderPage section="roles"` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/[organizationKey]/settings/teams/page.tsx`
  - Wrap `WorkspaceSettingsPlaceholderPage section="teams"` with `SettingsPageSection mode="readable"`
- `src/app/(protected)/(global)/invite/[invitationId]/page.tsx`
  - Add `SettingsContentRail` + `SettingsPageSection mode="readable"` around the page content
- `src/features/workspaces/components/pages/workspace-invitation-decision-page.tsx`
  - Remove the local `max-w-2xl`/centering constraint so width comes from the new shell
- `test/app/workspace-settings-page.test.tsx`
  - Assert workspace settings routes apply the correct width mode wrappers
- `test/app/account-invitations-page.test.tsx`
  - Assert the invite route uses the new outer rail plus `readable` section mode

## Task 1: Add Shared Settings Shell Primitives

**Files:**
- Create: `src/components/application/settings/settings-shell.tsx`
- Test: `test/ui/settings-shell.test.tsx`

- [ ] **Step 1: Write the failing UI test for the shared settings shell**

```tsx
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import {
  SettingsContentRail,
  SettingsPageSection,
  SettingsPageShell,
} from "@components/application/settings/settings-shell";

describe("settings shell primitives", () => {
  it("renders the shared settings rail with the approved spacing and max width", () => {
    const { container, getByTestId } = render(
      <SettingsPageShell nav={<div data-testid="settings-nav">nav</div>}>
        <div data-testid="settings-child">content</div>
      </SettingsPageShell>
    );

    expect(getByTestId("settings-nav")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="settings-content-rail"]')).toHaveClass(
      "min-w-0",
      "flex-1",
      "px-2",
      "md:mt-4",
      "md:px-4",
      "xl:px-6"
    );
    expect(container.querySelector('[data-slot="settings-page-rail"]')).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-6xl",
      "space-y-6"
    );
  });

  it("applies the readable mode width cap only when requested", () => {
    const { container, rerender } = render(
      <SettingsPageSection mode="readable">
        <div>readable</div>
      </SettingsPageSection>
    );

    expect(container.querySelector('[data-slot="settings-page-section"]')).toHaveAttribute(
      "data-mode",
      "readable"
    );
    expect(container.querySelector('[data-slot="settings-page-section"]')).toHaveClass(
      "w-full",
      "max-w-3xl"
    );

    rerender(
      <SettingsPageSection mode="wide">
        <div>wide</div>
      </SettingsPageSection>
    );

    expect(container.querySelector('[data-slot="settings-page-section"]')).toHaveAttribute(
      "data-mode",
      "wide"
    );
    expect(container.querySelector('[data-slot="settings-page-section"]')).not.toHaveClass(
      "max-w-3xl"
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='settings-shell'
```

Expected: FAIL because `@components/application/settings/settings-shell` does not exist yet.

- [ ] **Step 3: Write the minimal shared shell implementation**

```tsx
import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@lib/utils";

export type SettingsPageSectionMode = "wide" | "readable";

export const SettingsContentRail = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div
    data-slot="settings-content-rail"
    className={cn("min-w-0 flex-1 px-2 md:mt-4 md:px-4 xl:px-6", className)}
  >
    <div data-slot="settings-page-rail" className="mx-auto w-full max-w-6xl space-y-6">
      {children}
    </div>
  </div>
);

export const SettingsPageShell = ({
  nav,
  children,
  className,
}: PropsWithChildren<{ nav: ReactNode; className?: string }>) => (
  <div className={cn("flex flex-1 md:gap-8", className)}>
    {nav}
    <SettingsContentRail>{children}</SettingsContentRail>
  </div>
);

export const SettingsPageSection = ({
  mode = "wide",
  children,
  className,
}: PropsWithChildren<{ mode?: SettingsPageSectionMode; className?: string }>) => (
  <section
    data-slot="settings-page-section"
    data-mode={mode}
    className={cn("w-full", mode === "readable" && "max-w-3xl", className)}
  >
    {children}
  </section>
);
```

- [ ] **Step 4: Run the test again to verify it passes**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='settings-shell'
```

Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit the shell primitives**

```bash
git add src/components/application/settings/settings-shell.tsx test/ui/settings-shell.test.tsx
git commit -m "feat: add settings shell primitives"
```

## Task 2: Migrate the Two Shared Settings Layouts

**Files:**
- Modify: `src/app/(protected)/(global)/user/layout.tsx`
- Modify: `src/app/(protected)/(global)/[organizationKey]/settings/layout.tsx`
- Test: `test/app/settings-layout-shell.test.tsx`

- [ ] **Step 1: Write the failing layout test that expects both layouts to delegate to the shared shell**

```tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../../src/features/accounts/components/nav/nav-user-settings", () => ({
  NavUserSettings: () => <div data-testid="nav-user-settings">user-nav</div>,
}));

jest.mock("../../src/features/workspaces/components/nav/nav-workspace-settings", () => ({
  NavWorkspaceSettings: ({ organizationKey }: { organizationKey: string }) => (
    <div data-testid="nav-workspace-settings">{organizationKey}</div>
  ),
}));

jest.mock("../../src/features/organizations/components/organization-route-guard", () => ({
  OrganizationRouteGuard: ({
    children,
  }: {
    children: (organization: { id: string; slug: string }) => React.ReactNode;
  }) => <>{children({ id: "org-1", slug: "acme" })}</>,
}));

jest.mock("../../src/features/organizations/organizations-context", () => ({
  getOrganizationRouteKey: (organization: { slug?: string; id: string }) =>
    organization.slug ?? organization.id,
}));

jest.mock("../../src/components/application/settings/settings-shell", () => ({
  SettingsPageShell: ({
    nav,
    children,
  }: {
    nav: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-page-shell">
      <div data-testid="settings-shell-nav">{nav}</div>
      <div data-testid="settings-shell-children">{children}</div>
    </div>
  ),
}));

describe("settings layouts", () => {
  it("renders the user settings layout through the shared shell", async () => {
    const layoutModule = await import("../../src/app/(protected)/(global)/user/layout");
    const element = await layoutModule.default({ children: <div>profile-page</div> });

    render(element);

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-shell-nav")).toHaveTextContent("user-nav");
    expect(screen.getByTestId("settings-shell-children")).toHaveTextContent("profile-page");
  });

  it("renders the workspace settings layout through the shared shell", async () => {
    const layoutModule = await import(
      "../../src/app/(protected)/(global)/[organizationKey]/settings/layout"
    );
    const element = await layoutModule.default({
      children: <div>workspace-page</div>,
      params: Promise.resolve({ organizationKey: "acme" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-shell-nav")).toHaveTextContent("acme");
    expect(screen.getByTestId("settings-shell-children")).toHaveTextContent("workspace-page");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='settings-layout-shell'
```

Expected: FAIL because neither layout imports `SettingsPageShell` yet.

- [ ] **Step 3: Replace the inline narrow layout markup with the shared shell**

```tsx
import React from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { NavUserSettings } from "@features/accounts/components/nav/nav-user-settings";

export default async function UserSettingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SettingsPageShell nav={<NavUserSettings />}>{children}</SettingsPageShell>;
}
```

```tsx
import React from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ organizationKey: string }>;
}>) {
  const { organizationKey } = await params;

  return (
    <OrganizationRouteGuard organizationKey={organizationKey}>
      {(organization) => (
        <SettingsPageShell
          nav={
            <NavWorkspaceSettings organizationKey={getOrganizationRouteKey(organization)} />
          }
        >
          {children}
        </SettingsPageShell>
      )}
    </OrganizationRouteGuard>
  );
}
```

- [ ] **Step 4: Run the layout test again**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='settings-layout-shell'
```

Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit the shared layout migration**

```bash
git add \
  src/app/\(protected\)/\(global\)/user/layout.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/layout.tsx \
  test/app/settings-layout-shell.test.tsx
git commit -m "refactor: reuse settings shell in settings layouts"
```

## Task 3: Apply Width Modes to User Settings Routes

**Files:**
- Modify: `src/app/(protected)/(global)/user/profile/page.tsx`
- Modify: `src/app/(protected)/(global)/user/connections/page.tsx`
- Modify: `src/app/(protected)/(global)/user/security/page.tsx`
- Modify: `src/app/(protected)/(global)/user/danger/page.tsx`
- Modify: `src/app/(protected)/(global)/user/invitations/page.tsx`
- Test: `test/app/user-settings-page-width-modes.test.tsx`

- [ ] **Step 1: Write the failing route test for user page width modes**

```tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../../src/components/application/settings/settings-shell", () => ({
  SettingsPageSection: ({
    mode,
    children,
  }: {
    mode: "wide" | "readable";
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-page-section" data-mode={mode}>
      {children}
    </div>
  ),
}));

jest.mock("../../src/features/accounts/components/user-profile", () => ({
  UserProfile: () => <div data-testid="user-profile">profile</div>,
}));

jest.mock("../../src/features/accounts/components/user-connections", () => ({
  UserConnections: () => <div data-testid="user-connections">connections</div>,
}));

jest.mock("../../src/features/accounts/components/user-sessions", () => ({
  UserSessions: () => <div data-testid="user-sessions">security</div>,
}));

jest.mock("../../src/features/accounts/components/user-dangerous-zone", () => ({
  UserDangerousZone: () => <div data-testid="user-dangerous-zone">danger</div>,
}));

jest.mock("../../src/features/workspaces/components/pending-workspace-invitations-block", () => ({
  PendingWorkspaceInvitationsBlock: () => (
    <div data-testid="pending-workspace-invitations-block">invitations</div>
  ),
}));

jest.mock("../../src/features/accounts/accounts-actions", () => ({
  loadCurrentUser: () => Promise.resolve(undefined),
  loadCurrentUserAccounts: () => Promise.resolve([]),
  loadCurrentSession: () => Promise.resolve(null),
  loadCurrentUserSessions: () => Promise.resolve([]),
}));

jest.mock("../../src/features/workspaces/workspaces-invitations", () => ({
  loadCurrentUserPendingWorkspaceInvitations: () => Promise.resolve([]),
}));

jest.mock("../../src/lib/cookies", () => ({
  getFromCookie: () => Promise.resolve(null),
}));

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Settings" })),
}));

describe("user settings route width modes", () => {
  it("wraps profile, connections, security, and danger pages in readable sections", async () => {
    const profilePage = await import("../../src/app/(protected)/(global)/user/profile/page");
    const connectionsPage = await import(
      "../../src/app/(protected)/(global)/user/connections/page"
    );
    const securityPage = await import("../../src/app/(protected)/(global)/user/security/page");
    const dangerPage = await import("../../src/app/(protected)/(global)/user/danger/page");

    const profileElement = await profilePage.default();
    const connectionsElement = await connectionsPage.default();
    const securityElement = await securityPage.default();
    const dangerElement = await dangerPage.default();

    render(
      <div>
        {profileElement}
        {connectionsElement}
        {securityElement}
        {dangerElement}
      </div>
    );

    expect(screen.getAllByTestId("settings-page-section")).toHaveLength(4);
    expect(screen.getAllByTestId("settings-page-section").every((node) => node.dataset.mode === "readable")).toBe(true);
  });

  it("wraps the personal invitations page in a wide section", async () => {
    const invitationsPage = await import("../../src/app/(protected)/(global)/user/invitations/page");
    const element = await invitationsPage.default();

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
    expect(screen.getByTestId("pending-workspace-invitations-block")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='user-settings-page-width-modes'
```

Expected: FAIL because the user settings routes still return their components directly.

- [ ] **Step 3: Wrap each user settings route with the correct width mode**

```tsx
import type { Metadata } from "next";
import React from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { UserProfile } from "@features/accounts/components/user-profile";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.profile);

export default function ProfilePage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return (
    <SettingsPageSection mode="readable">
      <UserProfile loadCurrentUserPromise={loadCurrentUserPromise} />
    </SettingsPageSection>
  );
}
```

```tsx
import type { Metadata } from "next";
import React from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { UserConnections } from "@features/accounts/components/user-connections";
import { loadCurrentUserAccounts } from "@features/accounts/accounts-actions";
import { getFromCookie } from "@lib/cookies";
import { LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.connections);

export default async function ConnectionsPage() {
  const loadCurrentUserAccountsPromise = loadCurrentUserAccounts();
  const getLastLoginPromise = getFromCookie(LAST_LOGIN_METHOD_KEY);

  return (
    <SettingsPageSection mode="readable">
      <UserConnections
        loadCurrentUserAccountsPromise={loadCurrentUserAccountsPromise}
        getLastLoginPromise={getLastLoginPromise}
      />
    </SettingsPageSection>
  );
}
```

```tsx
import type { Metadata } from "next";
import React from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { loadCurrentSession, loadCurrentUserSessions } from "@features/accounts/accounts-actions";
import { UserSessions } from "@features/accounts/components/user-sessions";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.security);

export default function SecurityPage() {
  const loadCurrentUserSessionsPromise = loadCurrentUserSessions();
  const loadCurrentSessionPromise = loadCurrentSession();

  return (
    <SettingsPageSection mode="readable">
      <UserSessions
        loadCurrentUserSessionsPromise={loadCurrentUserSessionsPromise}
        loadCurrentSessionPromise={loadCurrentSessionPromise}
      />
    </SettingsPageSection>
  );
}
```

```tsx
import type { Metadata } from "next";
import React from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { UserDangerousZone } from "@features/accounts/components/user-dangerous-zone";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.danger);

export default function DangerousPage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return (
    <SettingsPageSection mode="readable">
      <UserDangerousZone loadCurrentUserPromise={loadCurrentUserPromise} />
    </SettingsPageSection>
  );
}
```

```tsx
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";
import { PendingWorkspaceInvitationsBlock } from "@features/workspaces/components/pending-workspace-invitations-block";
import { loadCurrentUserPendingWorkspaceInvitations } from "@features/workspaces/workspaces-invitations";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.invitations);

export default async function UserInvitationsPage() {
  const invitations = await loadCurrentUserPendingWorkspaceInvitations();

  return (
    <SettingsPageSection mode="wide">
      <PendingWorkspaceInvitationsBlock invitations={invitations} showEmptyState />
    </SettingsPageSection>
  );
}
```

- [ ] **Step 4: Run the user settings route test again**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='user-settings-page-width-modes'
```

Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit the user route width-mode migration**

```bash
git add \
  src/app/\(protected\)/\(global\)/user/profile/page.tsx \
  src/app/\(protected\)/\(global\)/user/connections/page.tsx \
  src/app/\(protected\)/\(global\)/user/security/page.tsx \
  src/app/\(protected\)/\(global\)/user/danger/page.tsx \
  src/app/\(protected\)/\(global\)/user/invitations/page.tsx \
  test/app/user-settings-page-width-modes.test.tsx
git commit -m "refactor: assign width modes to user settings pages"
```

## Task 4: Apply Width Modes to Workspace Settings Routes and the Invite Decision Route

**Files:**
- Modify: `src/app/(protected)/(global)/[organizationKey]/settings/workspace/page.tsx`
- Modify: `src/app/(protected)/(global)/[organizationKey]/settings/users/page.tsx`
- Modify: `src/app/(protected)/(global)/[organizationKey]/settings/invitations/page.tsx`
- Modify: `src/app/(protected)/(global)/[organizationKey]/settings/roles/page.tsx`
- Modify: `src/app/(protected)/(global)/[organizationKey]/settings/teams/page.tsx`
- Modify: `src/app/(protected)/(global)/invite/[invitationId]/page.tsx`
- Modify: `src/features/workspaces/components/pages/workspace-invitation-decision-page.tsx`
- Modify: `test/app/workspace-settings-page.test.tsx`
- Modify: `test/app/account-invitations-page.test.tsx`

- [ ] **Step 1: Extend the route tests so they fail until width modes are applied**

```tsx
jest.mock("../../src/components/application/settings/settings-shell", () => ({
  SettingsContentRail: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-content-rail">{children}</div>
  ),
  SettingsPageSection: ({
    mode,
    children,
  }: {
    mode: "wide" | "readable";
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-page-section" data-mode={mode}>
      {children}
    </div>
  ),
}));
```

Add these assertions to `test/app/workspace-settings-page.test.tsx`:

```tsx
jest.mock("../../src/features/workspaces/components/pages/workspace-settings-placeholder-page", () => ({
  WorkspaceSettingsPlaceholderPage: ({ section }: { section: string }) => (
    <div data-testid="workspace-settings-placeholder-page">{section}</div>
  ),
}));

it("renders the workspace settings form page inside a readable section", async () => {
  (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
    workspace: { id: "workspace-123", slug: "client-workspace" },
    canChangeDefault: true,
    canonicalOrganizationKey: "client-workspace",
  });

  const pageModule =
    await import("../../src/app/(protected)/(global)/[organizationKey]/settings/workspace/page");
  const element = await pageModule.default({
    params: Promise.resolve({ organizationKey: "client-workspace" }),
  });

  render(element);

  expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
});

it("marks the workspace users page as wide", async () => {
  (loadWorkspaceSettingsUsersPageContext as jest.Mock).mockResolvedValue({
    workspace: { id: "workspace-123", slug: "client-workspace" },
    canChangeDefault: true,
    canonicalOrganizationKey: "client-workspace",
    currentUserId: "user-123",
    members: [
      {
        id: "member-1",
        userId: "user-123",
        name: "Alice Adams",
        email: "alice@example.com",
        image: null,
        roleLabels: ["owner"],
        joinedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
    ],
    canAddMembers: true,
  });

  const pageModule =
    await import("../../src/app/(protected)/(global)/[organizationKey]/settings/users/page");
  const element = await pageModule.default({
    params: Promise.resolve({ organizationKey: "client-workspace" }),
  });

  render(element);

  expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
});

it("marks the workspace invitations page as wide", async () => {
  (loadWorkspaceInvitationsContext as jest.Mock).mockResolvedValue({
    workspace: { id: "workspace-123", slug: "client-workspace" },
    canChangeDefault: true,
    canonicalOrganizationKey: "client-workspace",
    invitations: [{ id: "invite-1" }],
    canCreateInvitations: true,
  });

  const pageModule =
    await import("../../src/app/(protected)/(global)/[organizationKey]/settings/invitations/page");
  const element = await pageModule.default({
    params: Promise.resolve({ organizationKey: "client-workspace" }),
  });

  render(element);

  expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
});

it("renders the roles placeholder inside a readable section", async () => {
  (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
    workspace: { id: "workspace-123", slug: "client-workspace" },
    canChangeDefault: true,
    canonicalOrganizationKey: "client-workspace",
  });

  const pageModule =
    await import("../../src/app/(protected)/(global)/[organizationKey]/settings/roles/page");
  const element = await pageModule.default({
    params: Promise.resolve({ organizationKey: "client-workspace" }),
  });

  render(element);

  expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
  expect(screen.getByTestId("workspace-settings-placeholder-page")).toHaveTextContent("roles");
});

it("renders the teams placeholder inside a readable section", async () => {
  (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
    workspace: { id: "workspace-123", slug: "client-workspace" },
    canChangeDefault: true,
    canonicalOrganizationKey: "client-workspace",
  });

  const pageModule =
    await import("../../src/app/(protected)/(global)/[organizationKey]/settings/teams/page");
  const element = await pageModule.default({
    params: Promise.resolve({ organizationKey: "client-workspace" }),
  });

  render(element);

  expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
  expect(screen.getByTestId("workspace-settings-placeholder-page")).toHaveTextContent("teams");
});
```

Add this assertion to `test/app/account-invitations-page.test.tsx`:

```tsx
jest.mock("../../src/components/application/settings/settings-shell", () => ({
  SettingsContentRail: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-content-rail">{children}</div>
  ),
  SettingsPageSection: ({
    mode,
    children,
  }: {
    mode: "wide" | "readable";
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-page-section" data-mode={mode}>
      {children}
    </div>
  ),
}));

expect(screen.getByTestId("settings-content-rail")).toBeInTheDocument();
expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
```

- [ ] **Step 2: Run the route tests to verify they fail**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='workspace-settings-page|account-invitations-page'
```

Expected: FAIL because the workspace routes and invite route do not apply the new wrappers yet.

- [ ] **Step 3: Apply the route wrappers and remove the local invite-page max width**

```tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPage } from "@features/workspaces/components/pages/workspace-settings-page";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

export const generateMetadata = async ({ params }: WorkspaceSettingsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_workspace, await params);

export default async function WorkspaceSettingsSectionPage({ params }: WorkspaceSettingsPageProps) {
  const { organizationKey } = await params;
  const { workspace, canChangeDefault, canonicalOrganizationKey } =
    await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_workspace.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="readable">
      <WorkspaceSettingsPage workspace={workspace} canChangeDefault={canChangeDefault} />
    </SettingsPageSection>
  );
}
```

```tsx
return (
  <SettingsPageSection mode="wide">
    <WorkspaceSettingsUsersPage
      organizationId={workspace.id}
      currentUserId={currentUserId}
      members={members}
      canAddMembers={canAddMembers}
    />
  </SettingsPageSection>
);
```

```tsx
return (
  <SettingsPageSection mode="wide">
    <WorkspaceSettingsInvitationsContent
      organizationId={workspace.id}
      invitations={invitations}
      canCreateInvitations={canCreateInvitations}
    />
  </SettingsPageSection>
);
```

```tsx
return (
  <SettingsPageSection mode="readable">
    <WorkspaceSettingsPlaceholderPage section="roles" />
  </SettingsPageSection>
);
```

```tsx
return (
  <SettingsPageSection mode="readable">
    <WorkspaceSettingsPlaceholderPage section="teams" />
  </SettingsPageSection>
);
```

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SettingsContentRail, SettingsPageSection } from "@components/application/settings/settings-shell";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceInvitationDecisionPage } from "@features/workspaces/components/pages/workspace-invitation-decision-page";
import { loadWorkspaceInvitationDecisionPageContext } from "@features/workspaces/workspaces-invitations";

export const generateMetadata = async ({
  params,
}: WorkspaceInvitationDecisionRoutePageProps): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.invitation, await params);

export default async function WorkspaceInvitationDecisionRoutePage({
  params,
}: WorkspaceInvitationDecisionRoutePageProps) {
  const { invitationId } = await params;
  const context = await loadWorkspaceInvitationDecisionPageContext(invitationId);

  if (!context) {
    notFound();
  }

  return (
    <SettingsContentRail>
      <SettingsPageSection mode="readable">
        <WorkspaceInvitationDecisionPage context={context} />
      </SettingsPageSection>
    </SettingsContentRail>
  );
}
```

```tsx
return (
  <Card className="w-full">
    <CardHeader>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>{t("title")}</CardTitle>
        <Badge variant={context.canRespond ? "default" : "outline"}>
          {t(`state.${context.state}.label`)}
        </Badge>
      </div>
      <CardDescription>{t(`state.${context.state}.description`)}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-sm">{t("details.workspace")}</dt>
          <dd className="mt-1 text-sm font-medium">{invitation.organizationName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">{t("details.email")}</dt>
          <dd className="mt-1 text-sm font-medium">{invitation.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">{t("details.role")}</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {invitation.roleLabels.map((roleLabel) => (
              <Badge key={`${invitation.id}-${roleLabel}`} variant="secondary">
                {roleLabel}
              </Badge>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">{t("details.inviter")}</dt>
          <dd className="mt-1 text-sm font-medium">{invitation.inviterName}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {context.canRespond ? (
          <>
            <Button onClick={submitAccept} disabled={pendingAction !== null}>
              {pendingAction === "accept" ? t("acceptPending") : t("acceptAction")}
            </Button>
            <Button variant="outline" onClick={submitReject} disabled={pendingAction !== null}>
              {pendingAction === "reject" ? t("rejectPending") : t("rejectAction")}
            </Button>
          </>
        ) : null}

        <Button asChild variant="ghost">
          <Link href={routes.accounts.pages.invitations.path()}>
            {t("viewInvitationsAction")}
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);
```

- [ ] **Step 4: Run the route tests again**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='workspace-settings-page|account-invitations-page'
```

Expected: PASS with all workspace settings and invite route assertions green.

- [ ] **Step 5: Commit the route-mode migration**

```bash
git add \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/workspace/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/users/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/invitations/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/roles/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/teams/page.tsx \
  src/app/\(protected\)/\(global\)/invite/\[invitationId\]/page.tsx \
  src/features/workspaces/components/pages/workspace-invitation-decision-page.tsx \
  test/app/workspace-settings-page.test.tsx \
  test/app/account-invitations-page.test.tsx
git commit -m "refactor: apply settings width modes to workspace and invite pages"
```

## Task 5: Run Focused Verification and Guard Against Regressions

**Files:**
- Verify: `src/components/application/settings/settings-shell.tsx`
- Verify: `src/app/(protected)/(global)/user/layout.tsx`
- Verify: `src/app/(protected)/(global)/[organizationKey]/settings/layout.tsx`
- Verify: user and workspace route files changed above
- Verify: `src/features/workspaces/components/pages/workspace-invitation-decision-page.tsx`
- Verify: tests changed above

- [ ] **Step 1: Run the focused Jest suite for the shell rollout**

Run:

```bash
npm run test -- --runInBand --testPathPatterns='settings-shell|settings-layout-shell|user-settings-page-width-modes|workspace-settings-page|account-invitations-page'
```

Expected: PASS with all focused suites green.

- [ ] **Step 2: Run ESLint on the changed files**

Run:

```bash
npm run lint -- \
  'src/components/application/settings/settings-shell.tsx' \
  'src/app/(protected)/(global)/user/layout.tsx' \
  'src/app/(protected)/(global)/[organizationKey]/settings/layout.tsx' \
  'src/app/(protected)/(global)/user/profile/page.tsx' \
  'src/app/(protected)/(global)/user/connections/page.tsx' \
  'src/app/(protected)/(global)/user/security/page.tsx' \
  'src/app/(protected)/(global)/user/danger/page.tsx' \
  'src/app/(protected)/(global)/user/invitations/page.tsx' \
  'src/app/(protected)/(global)/[organizationKey]/settings/workspace/page.tsx' \
  'src/app/(protected)/(global)/[organizationKey]/settings/users/page.tsx' \
  'src/app/(protected)/(global)/[organizationKey]/settings/invitations/page.tsx' \
  'src/app/(protected)/(global)/[organizationKey]/settings/roles/page.tsx' \
  'src/app/(protected)/(global)/[organizationKey]/settings/teams/page.tsx' \
  'src/app/(protected)/(global)/invite/[invitationId]/page.tsx' \
  'src/features/workspaces/components/pages/workspace-invitation-decision-page.tsx' \
  'test/ui/settings-shell.test.tsx' \
  'test/app/settings-layout-shell.test.tsx' \
  'test/app/user-settings-page-width-modes.test.tsx' \
  'test/app/workspace-settings-page.test.tsx' \
  'test/app/account-invitations-page.test.tsx'
```

Expected: PASS with no ESLint errors.

- [ ] **Step 3: Perform manual responsive verification**

Check these screens in the browser:

```text
/user/profile
/user/connections
/user/security
/user/danger
/user/invitations
/[organizationKey]/settings/workspace
/[organizationKey]/settings/users
/[organizationKey]/settings/invitations
/invite/[invitationId]
```

Verify:

- forms stay left-aligned and readable
- tables have noticeably more room before overflow
- invite page has outer spacing and no isolated narrow-card look
- light and dark theme geometry matches
- medium-width laptop widths still look intentional

- [ ] **Step 4: Commit the verified rollout**

```bash
git add \
  src/components/application/settings/settings-shell.tsx \
  src/app/\(protected\)/\(global\)/user/layout.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/layout.tsx \
  src/app/\(protected\)/\(global\)/user/profile/page.tsx \
  src/app/\(protected\)/\(global\)/user/connections/page.tsx \
  src/app/\(protected\)/\(global\)/user/security/page.tsx \
  src/app/\(protected\)/\(global\)/user/danger/page.tsx \
  src/app/\(protected\)/\(global\)/user/invitations/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/workspace/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/users/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/invitations/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/roles/page.tsx \
  src/app/\(protected\)/\(global\)/\[organizationKey\]/settings/teams/page.tsx \
  src/app/\(protected\)/\(global\)/invite/\[invitationId\]/page.tsx \
  src/features/workspaces/components/pages/workspace-invitation-decision-page.tsx \
  test/ui/settings-shell.test.tsx \
  test/app/settings-layout-shell.test.tsx \
  test/app/user-settings-page-width-modes.test.tsx \
  test/app/workspace-settings-page.test.tsx \
  test/app/account-invitations-page.test.tsx
git commit -m "refactor: widen settings shell for protected pages"
```
