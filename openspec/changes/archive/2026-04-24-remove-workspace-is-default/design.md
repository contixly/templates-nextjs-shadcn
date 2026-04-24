## Context

The application exposes Better Auth organizations as user-facing workspaces. It currently adds an `isDefault` boolean to
the shared organization record and uses that field for dashboard fallback, workspace ordering, settings forms, default
badges, and delete protection.

That model is inconsistent for shared workspaces: a workspace can have multiple members, but `Organization.isDefault`
can only hold one global value. The repository and mutation code scope updates by user membership, but the updated
records remain shared organization rows, so one user's default preference can affect other users.

The system already has a better primitive for "where the user is working now": Better Auth's
`session.activeOrganizationId`. This change makes that the only preference-like workspace context and keeps
deterministic fallback behavior for sessions with no valid active organization.

## Goals / Non-Goals

**Goals:**

- Remove persisted default workspace state from the organization model and application DTOs.
- Resolve `/dashboard` by valid `session.activeOrganizationId`, then the first accessible workspace in stable repository
  order.
- Keep workspace switching explicit: only switcher controls and successful workspace creation update the active
  organization session.
- Simplify workspace deletion so default status no longer blocks deletion; permission and "at least one workspace
  remains" still apply.
- Remove default workspace controls and labels from UI, translations, schemas, and tests.

**Non-Goals:**

- Do not introduce user-level workspace preferences in this change.
- Do not move default state to `Member`, `User`, or a new preference table.
- Do not change organization route-key behavior, slug preference, or access validation semantics.
- Do not change Better Auth membership or permission behavior beyond removing the custom organization field.

## Decisions

### Use `activeOrganizationId` plus deterministic fallback

Dashboard resolution will prefer a session `activeOrganizationId` only when it belongs to the current user's accessible
organizations. If it is missing, stale, or inaccessible, the system will choose the first accessible organization in a
stable order.

Alternative considered: move default state to `Member` or a new `UserWorkspacePreference` table. That would preserve
cross-session default preferences, but it keeps two competing concepts: active workspace and default workspace. The
explicit decision here is to remove default semantics entirely and keep the model smaller.

### Make repository ordering stable without default priority

Accessible workspace lists should sort by deterministic organization fields such as `name ASC, id ASC`. This gives
repeatable fallback behavior without encoding a user preference into shared organization data.

Alternative considered: keep existing order and treat missing `isDefault` as false. That still leaves dead semantics in
DTOs and UI and does not remove the source of confusion.

### Remove default state from public workspace DTOs

Workspace DTOs, schemas, and component props should not expose `isDefault`. Components should derive "current workspace"
from URL context or active selection flows, not from default flags.

Alternative considered: keep `isDefault` as a computed always-false compatibility field during migration. That reduces
short-term type churn but risks new code continuing to depend on an obsolete concept.

### Keep active organization updates explicit

Workspace creation will continue to set the new workspace as active after successful creation. Workspace switchers will
continue to call the active-organization action. Visiting deep links under `/:organizationKey/...` will continue to
render that URL context without mutating the active session.

Alternative considered: automatically set the deterministic fallback as active whenever `/dashboard` resolves it. That
would make fallback sticky, but it turns navigation into a hidden mutation and conflicts with the existing
explicit-switching requirement.

## Risks / Trade-offs

- Users lose cross-session "default workspace" preference -> Mitigation: keep last active workspace through Better Auth
  session state; when unavailable, fallback is deterministic and predictable.
- Existing cached repository results can include `isDefault` until deployment completes -> Mitigation: ship schema/code
  changes together, regenerate Prisma client, and invalidate/update workspace cache tags through affected mutation
  tests.
- Removing `isDefault` touches many UI and test surfaces -> Mitigation: keep implementation narrow: remove the field and
  its UI affordances, then update tests around active/fallback behavior.
- Deleting the previously default workspace becomes allowed when other deletion rules pass -> Mitigation: retain
  permission checks and the "at least one accessible workspace" guard.

## Migration Plan

1. Remove the Better Auth organization additional field configuration for `isDefault`.
2. Add a Prisma migration that drops `organizations.isDefault`.
3. Regenerate Prisma client.
4. Remove repository selects, sorting, DTO fields, schemas, mutations, UI controls, and translations that reference
   `isDefault`.
5. Update specs and tests to assert active-organization-first dashboard resolution and deterministic fallback.

Rollback would require re-adding the column and plugin additional field. Because the removed data is a shared and
semantically invalid preference, rollback should treat all restored values as `false` rather than attempting to
reconstruct per-user defaults.

## Open Questions

None for this change. If users later need cross-session preferences, that should be proposed separately as a user-scoped
workspace preference capability.
