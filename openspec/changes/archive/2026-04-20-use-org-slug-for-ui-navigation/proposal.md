## Why

Organization-backed workspaces already have slugs, but the UI still generates organization-scoped links from opaque organization IDs. That makes navigation URLs harder to read and share, and it weakens the value of slug management now that workspace settings already expose editable slugs.

## What Changes

- Update UI-generated organization-scoped navigation to prefer the organization slug when it exists and fall back to the organization ID otherwise.
- Teach organization route resolution, guards, and dashboard redirects to resolve workspace context from either a slug or an ID.
- Preserve backward compatibility for existing deep links that still use organization IDs.
- Update workspace creation, switching, and management flows so newly generated links and redirects use the slug-preferred route key.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `organization-context-routing`: Organization-scoped routes and global dashboard redirects use a slug-preferred route key while continuing to resolve existing ID-based links.
- `workspace-page-fallback`: The organization root handoff route validates and redirects when the route segment is either an organization slug or an organization ID.
- `workspace-organization-management`: Workspace create, switch, and settings flows generate slug-preferred workspace URLs and keep navigation aligned after slug updates.

## Impact

- Affected code: `src/features/dashboard`, `src/features/workspaces`, `src/features/organizations`, protected organization route files under `src/app/(protected)/(global)`, and shared route helpers in `src/lib/pages` and `src/features/routes`.
- Affected systems: organization-scoped navigation, route guard lookups, workspace switcher behavior, workspace settings redirects, and routing tests/spec coverage.
- Dependencies: no new external dependencies; implementation will rely on existing organization slug data already stored in Better Auth / Prisma.
