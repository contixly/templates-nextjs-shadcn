## Context

The app uses slug-preferred organization URLs and currently mounts organization pages at the first URL segment:

```text
/:organizationKey
/:organizationKey/dashboard
/:organizationKey/settings
```

Next.js App Router treats `[organizationKey]` as a dynamic route segment. Static routes such as `/workspaces`,
`/dashboard`, `/user`, and `/welcome` share the same top-level namespace. A slug validation denylist could block known
collisions, but it depends on keeping the reserved set accurate and still makes organization routing sensitive to
unrelated top-level route additions.

Putting organization routes under a short static prefix creates a clear namespace boundary:

```text
/w/:organizationKey
/w/:organizationKey/dashboard
/w/:organizationKey/settings
```

The route param name can stay `organizationKey`, so most loaders and guards can keep their existing context model.

## Goals / Non-Goals

**Goals:**

- Remove organization slugs from the top-level route namespace.
- Keep organization route keys slug-preferred and ID-compatible under `/w`.
- Keep the `organizationKey` route param name for existing guard, loader, and switcher concepts.
- Update all registered page definitions and generated links to use `/w/:organizationKey/...`.
- Preserve static top-level routes such as `/workspaces`, `/dashboard`, `/user`, `/welcome`, and `/invite/...`.

**Non-Goals:**

- Add reserved-word validation for workspace slugs.
- Migrate persisted workspace slugs or organization IDs.
- Preserve unprefixed `/:organizationKey/...` URLs as canonical routes.
- Introduce tenant subdomains or a longer prefix such as `/workspace`.

## Decisions

### Use `/w` as the organization namespace prefix

All organization-scoped pages should move below `src/app/(protected)/(global)/w/[organizationKey]`, and route
definitions should use `/w/[organizationKey]` path templates.

This makes the first URL segment static and owned by the app:

```text
/workspaces                    static workspace list
/dashboard                     static global dashboard resolver
/user/profile                  static account settings
/w/acme/dashboard              organization dashboard
/w/workspaces/dashboard        valid organization slug, no collision
```

Alternative considered: keep root organization routes and maintain a derived denylist. That reduces route churn but
leaves slug validity coupled to top-level route definitions.

### Remove the root dynamic organization route

The old `/:organizationKey` route should not remain as a migration redirect. Keeping a root dynamic route preserves the
same namespace hazard for future pages and still cannot redirect reserved-slug URLs such as `/workspaces`, because the
static route wins.

Existing unprefixed organization links will no longer be canonical. In this protected app context, correctness and route
isolation are more important than preserving old bookmarks.

Alternative considered: keep `/:organizationKey` only as a redirect to `/w/:organizationKey`. That gives partial
compatibility for non-conflicting slugs but leaves confusing inconsistent behavior for conflicting slugs.

### Keep `organizationKey` as the parameter name

The folder path should become `w/[organizationKey]`, not `w/[workspaceKey]`. The current repository, route guards,
loaders, workspace switchers, and metadata tests already use `organizationKey` to mean "slug or ID route key." Keeping
the name limits unrelated refactoring.

Alternative considered: rename the param to `workspaceKey`. That may read better in the UI domain, but it would mix a
route migration with a larger naming refactor.

### Update route definitions before generated links

Route modules are the source used by cards, switchers, breadcrumbs, metadata, and route resolution. Implementation
should update path templates first, then update tests and any direct literals that still assume the old root
organization route shape.

The intended route shape is:

```text
/w/[organizationKey]
/w/[organizationKey]/dashboard
/w/[organizationKey]/settings
/w/[organizationKey]/settings/workspace
/w/[organizationKey]/settings/invitations
/w/[organizationKey]/settings/users
/w/[organizationKey]/settings/teams
/w/[organizationKey]/settings/roles
```

## Risks / Trade-offs

- Existing unprefixed links break -> generated in-app links should all move to `/w`, and tests should cover key
  navigation paths.
- Route-file moves can miss metadata or loading files -> implementation should move page, loading, Open Graph, and
  Twitter image route files together.
- Direct string literals may survive route definition updates -> use `rg` for `"/[organizationKey]"`,
  `/:organizationKey`, and test path literals.
- The `/w` prefix itself becomes reserved as a static app segment -> this is acceptable because it is the explicit
  namespace boundary.

## Migration Plan

- No database migration is needed.
- Deploy route file moves and route definition updates together.
- Rollback requires restoring the previous `src/app/(protected)/(global)/[organizationKey]` route tree and old route
  templates.

## Open Questions

- None for the proposal. If compatibility for old non-conflicting bookmarks becomes required later, it should be
  evaluated as a separate explicit migration route with documented limitations.
