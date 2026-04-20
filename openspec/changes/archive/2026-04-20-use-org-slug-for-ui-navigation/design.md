## Context

The current organization-backed workspace implementation stores both `id` and `slug`, but organization-scoped navigation still uses `organizationId` everywhere. The global dashboard redirect, workspace create flow, sidebar switcher, workspace cards, and route guards all assume the URL segment is a raw organization ID, even though workspace settings already expose editable slugs.

This creates two practical issues:

- Generated URLs are opaque and less useful for sharing or debugging.
- Slug management is incomplete because changing a slug does not change how users navigate through the UI.

The change is cross-cutting because it touches route generation, route params, access validation, dashboard redirects, and workspace management flows. It also needs backward compatibility because existing links and bookmarks may still contain organization IDs.

## Goals / Non-Goals

**Goals:**

- Make UI-generated organization-scoped URLs prefer `organization.slug` and fall back to `organization.id` when needed.
- Keep existing ID-based deep links working while the application transitions to slug-first URLs.
- Centralize route-key derivation so navigation code does not duplicate `slug ?? id` logic across components and pages.
- Preserve the current authorization/session model where active organization state is still stored as `activeOrganizationId`.

**Non-Goals:**

- Change Better Auth session semantics from organization IDs to slugs.
- Remove support for existing ID-based links in this change.
- Redesign the public route structure beyond replacing the current organization segment value with a slug-preferred route key.
- Introduce invitation, membership, or workspace-management changes unrelated to navigation identity.

## Decisions

### 1. Separate canonical organization identity from route identity

Decision:

- Keep `organization.id` as the canonical identifier for auth, session state, mutations, and cache invalidation.
- Introduce a slug-preferred route identity (`organizationRouteKey = organization.slug || organization.id`) for all UI-generated organization-scoped URLs.

Rationale:

- Better Auth and session state already use IDs, and changing that would expand this change far beyond routing.
- URLs benefit from slugs, while data writes and permissions benefit from stable canonical IDs.
- A dedicated route-key concept makes the intent explicit and reduces repeated ad hoc logic in components.

Alternatives considered:

- Keep using `organizationId` everywhere: rejected because it does not satisfy the requested UI behavior.
- Replace IDs with slugs everywhere, including auth/session state: rejected because it would unnecessarily widen the change surface and risk authorization regressions.

### 2. Resolve organization-scoped routes by slug or ID, but generate slug-first links

Decision:

- Organization-scoped routes will accept a dynamic route key that may be either a slug or an ID.
- UI-generated links and redirects will always prefer the slug when present.

Rationale:

- This preserves backward compatibility for existing links.
- It lets the application move forward to readable URLs without a hard cutover.
- It aligns new navigation behavior with current workspace data, which already includes slugs.

Alternatives considered:

- Force an immediate slug-only cutover: rejected because it would break existing ID-based links and bookmarks.
- Continue generating IDs while only teaching pages to accept slugs: rejected because users would not see the intended behavior change.

### 3. Centralize route-key helpers in the organizations/routing layer

Decision:

- Add shared helpers for:
  - deriving a route key from an organization/workspace DTO
  - resolving an accessible organization from an incoming route key
  - building dashboard/workspace URLs from the route key rather than from raw IDs

Rationale:

- The current route generation is scattered across page components and workspace UI components.
- Shared helpers make the change smaller to implement and easier to test.
- Centralization reduces the chance of partial migration where some links still emit IDs.

Alternatives considered:

- Inline `slug ?? id` in each caller: rejected because it would be brittle and easy to miss during implementation.
- Push slug logic into generic path building only: rejected because route building still needs organization-aware data and fallback logic.

### 4. Rename route params in code to match the new semantics

Decision:

- Update page params, route helper match keys, and organization route utilities to use a semantic name such as `organizationKey` instead of `organizationId` where the value may be either form.

Rationale:

- The current naming becomes misleading once the route segment can contain a slug.
- Semantic naming makes future maintenance and tests clearer.
- It keeps the distinction between canonical ID fields and URL route keys explicit.

Alternatives considered:

- Keep the `organizationId` variable name while overloading it with slugs: rejected because it would encode incorrect meaning into the codebase.

### 5. Keep ID-based session resolution, then map the chosen organization to a route key

Decision:

- Global routes such as `/dashboard` will continue choosing the active/default organization by canonical ID, then redirect using that organization's route key.

Rationale:

- Session and default-resolution logic already works on IDs and does not need to change materially.
- The redirect output changes, but the underlying selection algorithm stays stable.
- This minimizes risk while still producing slug-preferred URLs.

Alternatives considered:

- Rebuild default-resolution logic around slugs: rejected because it adds no value once route-key conversion happens after organization selection.

## Risks / Trade-offs

- [Partial migration leaves mixed URL generation paths] → Add shared route-key helpers first and update all organization-scoped callers to use them.
- [Route access checks still assume IDs] → Replace ID-only repository/guard lookups with route-key-aware organization resolution before updating page redirects.
- [Slug changes can leave users on outdated bookmarked URLs] → Keep slug and ID route resolution backward compatible so old links continue to work.
- [Internal refactor expands beyond the visible UI request] → Limit the semantic rename to organization-scoped routing utilities and params, while leaving unrelated domain APIs on IDs.

## Migration Plan

1. Introduce organization route-key helpers and route-key-aware organization lookup in the organizations slice.
2. Update shared route typings and feature route definitions so organization-scoped pages build URLs from `organizationKey`.
3. Update global dashboard redirects, organization root handoff, route guards, and metadata/opengraph loaders to resolve route keys instead of raw IDs.
4. Update workspace UI surfaces that navigate between organizations so they emit slug-preferred URLs.
5. Add or update tests covering slug-based navigation, ID-link backward compatibility, and redirects after workspace create/switch/update.

Rollback strategy:

- Revert the change and restore ID-only route helpers. Because canonical organization IDs remain unchanged, rollback is a code-only revert with no data migration.

## Open Questions

- Whether ID-based URLs should remain as silent backward-compatible aliases or be redirected to canonical slug URLs when a slug exists.
- Whether slug update flows should immediately navigate the current page to the new slug-based URL when the user is editing the workspace they are currently viewing.
