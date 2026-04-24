## 1. Auth and Schema Baseline

- [x] 1.1 Add Better Auth `organization()` server plugin and `organizationClient()` client plugin, including organization schema extensions for `isDefault`
- [x] 1.2 Remove the Prisma `Workspace` model and delete legacy Prisma migration history from the repository
- [x] 1.3 Regenerate Prisma schema/types and create a fresh initial migration that includes Better Auth organization/session fields

## 2. Organization Domain Slice

- [x] 2.1 Create `features/organizations` with organization types, DTO adapters, and context helpers for URL, active session, and default organization resolution
- [x] 2.2 Implement organization-backed loaders/repositories for accessible organizations, default organization lookup, and membership validation
- [x] 2.3 Implement organization actions for create workspace, update workspace name/slug, set default workspace, and set active organization explicitly

## 3. Routing and Guard Flow

- [x] 3.1 Replace workspace-scoped protected routes with organization-scoped routes under `/:organizationId/...`
- [x] 3.2 Implement the global `/dashboard` redirect flow using active organization, default organization, deterministic fallback, and welcome redirect rules
- [x] 3.3 Implement the `/:organizationId` handoff route with access validation, forbidden behavior, and route-level loading feedback
- [x] 3.4 Add the reusable zero-workspace onboarding guard and render it on organization-scoped routes when the user has no accessible workspaces

## 4. Workspace UX on Top of Organizations

- [x] 4.1 Rebuild the sidebar workspace switcher in the target `org-switcher` style while keeping workspace terminology in the UI
- [x] 4.2 Update breadcrumb workspace selection to reflect the workspace from URL context instead of session active context
- [x] 4.3 Rebuild `/workspaces` to manage Better Auth organizations through the existing workspace UX, including create and settings flows
- [x] 4.4 Add the reusable onboarding block to the welcome page with create-workspace and invitation entry actions

## 5. Cleanup and Verification

- [x] 5.1 Remove or retire legacy workspace repositories/actions/components that depend on the deleted Prisma `Workspace` model
- [x] 5.2 Update route helpers, metadata, translations, and tests from `workspaceId` assumptions to organization-backed workspace behavior
- [x] 5.3 Run lint/tests relevant to routing, auth, and workspace management, then verify the new OpenSpec requirements are covered by implementation
