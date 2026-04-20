## Context

The application currently stores workspaces in a local Prisma `Workspace` model and uses that model for listing, CRUD, and limited route validation. That model is now a poor fit for the product direction: membership and invitation flows need Better Auth organizations, the current workspace switcher is incomplete, and route context is split between a global dashboard and a legacy `/workspaces/[workspaceId]` handoff route.

The new design must preserve the user-facing "Workspace" terminology while moving the actual tenant model to Better Auth `organization`. The app also needs two distinct context concepts:

- URL context: the organization currently opened in the application (`/:organizationId/...`)
- Session active context: the user's current default workspace for global entry points such as `/dashboard`

This distinction is intentional. Opening a deep link in another workspace must not silently rewrite the user's default workspace. Only explicit actions in the workspace switcher or settings may update the active session context.

Constraints:

- The repository follows feature-slice design, so organization logic should live in a new `features/organizations` slice instead of being spread across app routes.
- Next.js 16 App Router patterns and cache semantics in local docs remain the source of truth.
- The app keeps "Workspace" copy in UI and translations even after switching to organizations internally.
- Existing Prisma migrations are intentionally discarded in favor of a fresh initial migration that already contains Better Auth organization schema.

## Goals / Non-Goals

**Goals:**

- Replace local workspace persistence with Better Auth organizations as the single tenant source of truth.
- Introduce a dedicated `features/organizations` slice for organization-aware loaders, actions, adapters, and context helpers.
- Move application home pages under `/:organizationId/dashboard` and make `/dashboard` resolve the user's default organization context.
- Keep workspace selection explicit: URL controls opened context, session controls global default context.
- Provide a reusable zero-workspace onboarding block that can guard organization-scoped routes and power the welcome screen.
- Preserve workspace terminology in UI while allowing internal code to speak in terms of organizations.

**Non-Goals:**

- Implement invitation acceptance and join flows in this change; the guard may expose an entry point or placeholder only.
- Migrate historical production data from the old `Workspace` table; the migration strategy is a fresh schema baseline.
- Rename every existing workspace-facing file, route namespace, or translation key to `organization`; presentation terminology stays as-is.
- Introduce organization-scoped business features beyond routing, context, onboarding, and management primitives.

## Decisions

### 1. Create a new `features/organizations` slice instead of mutating `features/workspaces` in place

Decision:
- Build a clean `features/organizations` slice that owns Better Auth organization integration, DTO mapping, active/default context helpers, and organization-scoped actions.

Rationale:
- The current `features/workspaces` slice is tightly coupled to the deleted Prisma model.
- A new slice preserves architectural clarity and avoids a half-migrated abstraction where workspace code still assumes local persistence.
- `features/workspaces` can remain as the UI-facing workspace management surface backed by organization adapters.

Alternatives considered:
- Reuse `features/workspaces` for everything: rejected because it mixes presentation terminology with the new auth-backed domain model and makes cleanup harder.
- Replace all workspace naming with organization naming everywhere: rejected because the product intentionally keeps "Workspace" in the user experience.

### 2. Treat URL context and session context as separate, first-class concepts

Decision:
- `organizationId` in the URL defines the currently opened workspace.
- `session.activeOrganizationId` defines the default workspace for global transitions and can only change through explicit user actions.

Rationale:
- Deep links into another workspace must not mutate the user's preferred default context.
- Sidebar switcher and breadcrumbs should always reflect the workspace currently open in the page hierarchy.
- Global routes such as `/dashboard` need a stable decision source that survives page-to-page navigation without requiring URL context.

Alternatives considered:
- Auto-sync URL context into `session.activeOrganizationId`: rejected because any cross-workspace link would silently rewrite the user's default workspace.
- Ignore `session.activeOrganizationId` and use URL only: rejected because global routes need a deterministic default workspace resolution strategy.

### 3. Store default workspace selection on the organization record

Decision:
- Extend Better Auth organization schema with `organization.additionalFields.isDefault`.

Rationale:
- The product wants a durable "default workspace" preference distinct from the volatile active session context.
- Keeping the flag on the organization record avoids another preference table and keeps default selection easy to query when resolving `/dashboard`.
- Better Auth organization schema supports custom additional fields on the organization model.

Alternatives considered:
- Store default workspace in a separate user preference table: rejected as unnecessary complexity for a single boolean relationship.
- Reuse `activeOrganizationId` as the default workspace: rejected because session state is ephemeral and explicitly user-switched, not a durable preference.

### 4. Use Better Auth organization plugin as the only tenant source of truth

Decision:
- Remove the Prisma `Workspace` model and all workspace CRUD/repository logic tied to it.
- Add Better Auth `organization()` and `organizationClient()` plugins and rely on their organization/member/session primitives.

Rationale:
- Membership, invitations, and active organization already belong to Better Auth's domain.
- Duplicating tenant data locally would require synchronization, duplicated permissions, and more migrations.
- A single source of truth simplifies route guards, switcher data, and future invitation work.

Alternatives considered:
- Hybrid workspace + organization model: rejected because it creates two tenant identities to keep in sync.

### 5. Make organization-scoped routes the primary application shell

Decision:
- Move the effective organization home to `/:organizationId/dashboard`.
- Keep `/dashboard` as a smart redirect that resolves the user's session/default organization.
- Preserve an organization root handoff route `/:organizationId` that validates membership and redirects to `/:organizationId/dashboard`.

Rationale:
- Future objects inside a workspace need the organization id in the URL.
- Keeping `/dashboard` lets global navigation and existing habits continue working.
- Preserving an organization root handoff route makes access validation and loading behavior explicit and keeps parity with the current fallback capability.

Alternatives considered:
- Remove `/dashboard` entirely: rejected because the product wants a global entry point.
- Require every entry point to include organization id: rejected because welcome, workspace management, and account pages are intentionally global.

### 6. Guard zero-workspace users in server-rendered organization layouts/pages

Decision:
- Handle the "no accessible workspaces" state in server-rendered organization route boundaries and render a reusable onboarding block instead of raw redirects.

Rationale:
- The UX needs a meaningful blocked state, not just a transport-level redirect.
- Guard logic depends on membership queries and should remain close to the route tree.
- Global routes such as `/workspaces` and account pages must remain accessible, so route-level boundaries are a cleaner fit than broad middleware redirection.

Alternatives considered:
- Enforce this in `proxy.ts`: rejected because middleware is not a good place to render rich onboarding UI and would over-couple routing to auth checks.

### 7. Reset migration history and generate a fresh baseline schema

Decision:
- Delete existing migrations and produce a new initial migration that includes Better Auth organization/session schema, removes `Workspace`, and reflects the new app baseline.

Rationale:
- The user explicitly wants a clean schema baseline rather than migration-on-top-of-migration churn.
- This change rewrites the tenant model deeply enough that preserving old migration history adds noise with little value.

Alternatives considered:
- Incremental migration from `Workspace` to `organization`: rejected because the desired outcome is a clean start and there is no requirement to preserve old migration history.

## Risks / Trade-offs

- [Route churn across the app] → Centralize route helpers early and update tests/metadata exports together to avoid mixed `workspaceId` and `organizationId` assumptions.
- [Confusion between opened workspace and default workspace] → Define and document the distinction in the organization slice and keep switcher/breadcrumb data sourced from URL context only.
- [Fresh migration reset can surprise contributors] → Capture the reset explicitly in proposal/tasks and ensure the resulting Prisma schema is generated from the new auth configuration before implementation is considered complete.
- [Workspace UI copy backed by organization APIs can create adapter leaks] → Keep DTO mapping and organization-to-workspace presentation logic in one slice instead of duplicating it across pages/components.
- [Invitation flow is deferred] → Provide a clear placeholder/entry point in the onboarding block so the current change does not block future invitation implementation.

## Migration Plan

1. Add Better Auth organization plugins and schema configuration, including custom `isDefault` organization field.
2. Regenerate Prisma schema/types so Better Auth organization/session tables and fields become part of the baseline.
3. Delete legacy `Workspace` model and remove historical Prisma migrations from the repository.
4. Create a fresh initial migration from the new schema baseline.
5. Introduce `features/organizations` and move route/context resolution onto organization-backed loaders and actions.
6. Rebuild global dashboard redirect, organization root handoff, and organization-scoped layouts/pages.
7. Replace sidebar and breadcrumb switchers with organization-backed UI while keeping workspace labels.
8. Rebuild `/workspaces` on top of organization-backed data and remove old workspace repositories/actions.

Rollback strategy:
- Before implementation lands, rollback is a simple Git revert.
- After implementation, rollback means reverting the branch and regenerating the prior schema state; there is no in-place compatibility promise because this change intentionally resets the migration baseline.

## Open Questions

- Whether the welcome page should expose invitation entry as a placeholder button or a disabled secondary action until invitation flows exist.
- Whether organization root routes beyond `/:organizationId` need dedicated loading states, or if the handoff route alone is sufficient for the initial migration.
