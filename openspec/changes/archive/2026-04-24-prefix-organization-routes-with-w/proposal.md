## Why

Organization pages are currently mounted at `/:organizationKey`, sharing the top-level URL namespace with static app
pages. Any workspace slug can therefore collide with present or future top-level routes, and a denylist derived from
route definitions would still be a defensive workaround rather than a reliable URL boundary.

## What Changes

- **BREAKING**: Move organization-scoped pages from `/:organizationKey/...` to `/w/:organizationKey/...`.
- Update the organization root, dashboard, settings, and other organization-scoped route definitions to use the `/w`
  prefix.
- Update global dashboard resolution, workspace switching, workspace cards, invite redirects, breadcrumbs, metadata
  params, and route helpers to generate `/w/:organizationKey/...` URLs.
- Remove the need for route-reserved workspace slug validation; workspace slugs remain normal identifiers because they
  no longer compete with top-level app routes.
- Remove the root `/:organizationKey` organization route instead of preserving it as a compatibility redirect.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `organization-context-routing`: Organization context routes move from the root namespace to `/w/:organizationKey/...`.
- `workspace-organization-management`: Workspace creation and switching navigate to `/w/:organizationKey/dashboard`, and
  workspace labels follow `/w/:organizationKey/...` URL context.
- `workspace-page-fallback`: The organization root fallback route moves from `/:organizationKey` to
  `/w/:organizationKey`.

## Impact

- Affects `src/app/(protected)/(global)/[organizationKey]` route files, which should move under
  `src/app/(protected)/(global)/w/[organizationKey]`.
- Affects route definitions in workspace and dashboard route modules.
- Affects organization route helpers, workspace switch navigation, generated links, page metadata tests, route
  resolution tests, and page tests.
- Does not require database or slug migration.
