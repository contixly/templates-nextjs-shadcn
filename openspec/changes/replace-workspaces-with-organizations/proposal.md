## Why

The app currently models workspaces as a local Prisma entity with incomplete context switching, while the product direction requires organization-aware membership, invitations, and session-backed default context. We need to replace this custom tenant model now so future organization-scoped features can build on a single source of truth instead of a temporary workspace abstraction.

## What Changes

- Replace the Prisma `Workspace` model and its CRUD flows with Better Auth `organization` plugin entities and APIs.
- Introduce a new internal `features/organizations` slice that owns organization data loading, context resolution, and organization actions.
- Keep "Workspace" as the user-facing term in UI, copy, and management pages even though the internal entity is `organization`.
- **BREAKING** Move organization-scoped application routes from the current workspace route shape to `/:organizationId/...`, with `/:organizationId/dashboard` as the organization home page.
- **BREAKING** Make `/dashboard` a redirect that resolves the user's default session context and sends them to `/:organizationId/dashboard`.
- Add a reusable onboarding guard block for users with zero workspaces, shown on the welcome page and on organization-scoped routes that cannot render yet.
- Replace the existing breadcrumb dropdown with a sidebar-style workspace switcher that reflects the workspace from the current URL and updates session active context only when the user switches explicitly.
- Remove existing Prisma migrations and regenerate the schema/migration history from scratch around Better Auth organizations and application tables.

## Capabilities

### New Capabilities
- `organization-context-routing`: Resolve workspace context from organization membership, support organization-scoped routes, and derive global dashboard redirects from session/default organization state.
- `workspace-organization-management`: Manage Better Auth organizations behind the existing "Workspace" UX, including create, update, slug management, default workspace selection, and explicit active context switching.
- `workspace-onboarding-guard`: Provide a reusable onboarding guard for users without any workspace and surface create/join entry points from welcome and blocked organization-scoped routes.

### Modified Capabilities
- `workspace-page-fallback`: Replace legacy workspace route validation behavior with organization-aware access validation and loading behavior for the new organization-scoped route structure.

## Impact

- Affected code: `src/server/auth.ts`, `src/lib/auth-client.ts`, protected app routes, sidebar and breadcrumbs, welcome flow, current `features/workspaces` data/actions, Prisma schema, migrations, and tests.
- Affected systems: Better Auth organization/session schema, protected routing, onboarding flow, sidebar navigation, metadata generation, and i18n-backed workspace copy.
- Dependencies: Better Auth `organization()` and `organizationClient()` plugins with custom organization fields, regenerated Prisma schema/migrations, and route/test updates across workspace-context consumers.
