## Context

The app uses App Router organization-scoped URLs where the first dynamic segment is `organizationKey`. Workspace
switchers currently call `setActiveOrganization` and then always navigate to `/:organizationKey/dashboard`, using the
selected workspace slug when available.

Base workspace pages such as `/:organizationKey/settings/invitations` are defined in `workspaces-routes.ts` and only
vary by `organizationKey`. They can be transferred to another workspace by replacing that one segment. Complex routes
can include additional dynamic identifiers, for example a future `/:organizationKey/:resourceId`, and those identifiers
are not guaranteed to exist in the selected workspace.

Relevant Next.js docs from `node_modules/next/dist/docs/` support the current client-side pattern: `useRouter` is the
App Router API for programmatic navigation from Client Components, `usePathname` is the API for reading the current
pathname, and `useParams` exposes current dynamic route parameters. The existing switcher components are already Client
Components wrapped in `Suspense`, which is important because `cacheComponents` is enabled and these controls live under
dynamic routes.

## Goals / Non-Goals

**Goals:**

- Preserve the user's current base workspace page when switching to another accessible workspace.
- Fall back to the selected workspace dashboard when the current route is unsupported, unknown, or has dynamic route
  identifiers other than `organizationKey`.
- Keep header breadcrumb switcher and sidebar switcher behavior identical.
- Continue updating `session.activeOrganizationId` through the existing server action before navigating.

**Non-Goals:**

- Preserve resource-specific pages, record IDs, invitation IDs, or other workspace-specific dynamic identifiers.
- Add access pre-validation for the target page beyond the existing selected-workspace accessibility and route-level
  guards.
- Preserve query strings or hash fragments; this change is scoped to route path continuity.
- Change workspace creation, deletion, settings mutation, or dashboard fallback semantics.

## Decisions

### Resolve the next URL through a shared workspace switch helper

Add a small helper in the workspaces feature, for example `resolveWorkspaceSwitchHref`, that accepts the current
pathname and selected workspace route identity. It returns the href that both switchers pass to `router.push`.

The helper should use the existing route registry instead of hand-coded string slicing:

- Resolve the current pathname to a registered `Page` via `findRouteByPath`.
- Inspect the matched `pathTemplate`.
- Preserve the route only when the template contains exactly one dynamic segment and that segment is
  `[organizationKey]`.
- Build the preserved href with the matched page's `path({ organizationKey })`.
- Otherwise return `routes.dashboard.pages.organization_dashboard.path({ organizationKey })`.

Alternative considered: replace the first path segment manually. That is simpler but would preserve unknown or complex
paths by accident, including paths with resource IDs that the user explicitly called out as unsafe.

### Prefer route templates over an explicit allowlist

The preservation rule should be derived from route templates: a route is transferable only if `organizationKey` is its
only dynamic segment. This automatically covers current base settings pages and future base organization-scoped pages
without needing to remember to update a separate list.

Alternative considered: define an allowlist of workspace page keys. An allowlist is more restrictive but easier to
forget when adding new base pages. The template-based rule matches the requirement more directly and still excludes
additional identifiers.

### Keep selected workspace route key slug-preferred

The helper should continue using `getOrganizationRouteKey(selectedWorkspace)` so destination URLs use the selected
workspace slug when one exists, falling back to ID only when necessary.

Alternative considered: pass only the selected ID to the helper. That would work functionally but regress the existing
slug-preferred URL behavior.

### Keep navigation after active organization mutation

Both switchers should still call `setActiveOrganization` first, show the existing error toast on failure, then navigate
and refresh on success. This preserves the current session semantics while changing only the destination selection.

Alternative considered: navigate first and let route context drive the UI. That would make the page feel faster but
could leave `session.activeOrganizationId` stale when the user expects an explicit workspace switch.

## Risks / Trade-offs

- A registered route may be transferable by template but not semantically implemented for all workspaces -> existing
  route guards and page loaders still own authorization and page-level fallback.
- `findRouteByPath` is route-registry based, so newly added routes must be registered to participate in preservation ->
  unregistered paths safely fall back to dashboard.
- Query string state is dropped -> avoids carrying workspace-specific filters across workspaces, but users may need to
  reapply filters after switching.
- Adding `usePathname` to switchers increases reliance on App Router client hooks -> existing `Suspense` wrappers
  satisfy the documented Cache Components caveat.
