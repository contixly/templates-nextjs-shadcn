## Why

Workspace default state is currently stored on the shared Better Auth organization record. Because multiple users can
belong to the same workspace, changing `isDefault` for one user can change fallback behavior and UI state for other
members.

This change removes persisted default workspace semantics and makes workspace resolution depend on the user's active
organization session first, then a deterministic accessible-workspace fallback.

## What Changes

- **BREAKING**: Remove `Organization.isDefault` from the workspace domain model, Prisma schema, Better Auth organization
  additional fields, DTOs, schemas, forms, labels, repository selects, sorting, and mutations.
- Replace `/dashboard` default workspace resolution with `session.activeOrganizationId` when it is accessible, otherwise
  the first accessible workspace in deterministic repository order.
- Keep explicit workspace switching as the only way to update `session.activeOrganizationId`.
- Allow workspace deletion rules to depend on permission and "at least one accessible workspace remains", without
  treating any workspace as undeletable because it is default.
- Remove user-facing default workspace controls, badges, star indicators, and copy.
- Preserve stable route behavior: organization-scoped URLs continue to use the URL organization key, and deep links do
  not rewrite active session context.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `organization-context-routing`: Remove default organization fallback from global dashboard resolution; define
  active-session-first plus deterministic fallback behavior.
- `workspace-organization-management`: Remove default workspace settings, creation/update payloads, ordering, labels,
  and deletion constraints.

## Impact

- Prisma schema and migration history: remove the `isDefault` organization column through a new migration.
- Better Auth organization plugin config: remove the `isDefault` additional organization field.
- Repository and DTO layer: remove `isDefault` selects, types, mappings, default lookup, and `isDefault` sorting.
- Server actions: remove default mutation behavior from create/update flows and delete guards.
- UI and i18n: remove default checkbox, badge, star, notice, and related translations.
- Tests: update dashboard routing, workspace management actions, schemas, settings forms, switchers, cards, and
  repository cache tests to assert active/fallback behavior without default state.
