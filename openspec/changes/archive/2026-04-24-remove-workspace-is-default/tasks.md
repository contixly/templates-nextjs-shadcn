## 1. Preparation

- [x] 1.1 Read the relevant Next.js docs in `node_modules/next/dist/docs/` for server actions, cache invalidation, and routing before changing Next.js code.
- [x] 1.2 Audit all `isDefault`, `findDefaultOrganizationByUserId`, and default-workspace UI/message references to confirm the full removal surface.

## 2. Data Model and Auth Configuration

- [x] 2.1 Remove `isDefault` from the Prisma `Organization` model and add a migration that drops `organizations.isDefault`.
- [x] 2.2 Regenerate the Prisma client and ensure generated types no longer expose `Organization.isDefault`.
- [x] 2.3 Remove the Better Auth organization `isDefault` additional field configuration from server auth setup.

## 3. Repository, DTO, and Routing Behavior

- [x] 3.1 Remove `isDefault` from organization workspace DTO/record types, DTO mapping, repository selects, and cache-tag related tests.
- [x] 3.2 Replace workspace ordering with deterministic non-default ordering such as `name ASC, id ASC`.
- [x] 3.3 Remove `findDefaultOrganizationByUserId` and update `/dashboard` resolution to use valid `activeOrganizationId` followed by deterministic fallback only.
- [x] 3.4 Update organization context helpers and tests so default organization input is no longer part of resolution.

## 4. Server Actions and Validation

- [x] 4.1 Remove `isDefault` from create/update workspace schemas and form schemas.
- [x] 4.2 Remove default-workspace mutation logic from workspace create/update actions and stop sending `isDefault` to Better Auth organization APIs.
- [x] 4.3 Remove the set-default organization action if it has no remaining callers.
- [x] 4.4 Update workspace delete behavior so default state no longer blocks deletion while permission and "at least one accessible workspace" guards remain.
- [x] 4.5 Ensure all changed mutations still update the appropriate workspace/organization cache tags.

## 5. UI and Messages

- [x] 5.1 Remove default workspace checkbox controls from create and settings forms.
- [x] 5.2 Remove default workspace badges, star indicators, labels, and fallback selection from workspace cards and switchers.
- [x] 5.3 Remove default-workspace delete notices and any default-specific disabled states.
- [x] 5.4 Remove or update workspace and application translations/generated message typings that mention default workspace state.

## 6. Tests and Verification

- [x] 6.1 Update unit tests for dashboard routing, organization context helpers, repositories, schemas, workspace actions, forms, switchers, cards, and settings pages.
- [x] 6.2 Add or update tests for deterministic fallback when active organization is absent or inaccessible.
- [x] 6.3 Run targeted Jest tests for affected dashboard, organization, and workspace suites.
- [x] 6.4 Run `npm run lint`.
- [x] 6.5 Run `npm run build`.
