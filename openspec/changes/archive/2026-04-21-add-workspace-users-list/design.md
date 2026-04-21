## Context

The application already uses Better Auth organizations as the backing model for workspaces. The `/[organizationKey]`
settings area exists, and the `/settings/users` route is already wired into navigation, but it still renders a
placeholder.

Better Auth documents a `listMembers` capability for organization members, and the installed package confirms that the
feature is backed by the same `member` and `user` records already available through Prisma. In this codebase, data
loading is typically routed through feature repositories with cache tags, while sensitive mutations go through
protected server actions. This change only needs a read path.

## Goals / Non-Goals

**Goals:**
- Turn the workspace users settings page into a functional read-only member list.
- Keep the implementation aligned with the existing workspace settings routing and page-shell patterns.
- Preserve workspace terminology in the UI while using Better Auth organization membership as the source of truth.
- Represent current Better Auth role data safely, including multi-role strings.
- Present the current user differently from other workspace members so the rest of the organization can be scanned as a
  table.

**Non-Goals:**
- Inviting users, cancelling invitations, or showing pending invitations on the users page.
- Updating roles, removing members, or adding leave-organization controls.
- Introducing custom Better Auth access-control roles or enabling teams.
- Adding client-side search, pagination, or filtering in the first release.

## Decisions

### 1. Read member data through an application repository backed by Prisma

The users page will load member data through a server-side repository/query in the app rather than calling
`auth.api.listMembers` directly from the page.

Rationale:
- The repository pattern already backs workspace and organization reads in this codebase.
- Prisma access lets the page participate in the existing cache-tag strategy.
- Better Auth internally builds `listMembers` from the same member and user records, so this does not introduce a new
  data source.

Alternatives considered:
- Call `auth.api.listMembers` directly. This aligns with the public Better Auth API surface, but it is less natural for
  the repository-and-cache architecture already used by the app.

### 2. Keep the first release read-only

The page will display workspace users but will not include invite, remove, or role-edit actions.

Rationale:
- The request is specifically about validating and surfacing the member list.
- Invitations and roles already have separate settings routes and should remain isolated changes.
- The current Better Auth configuration does not define custom roles or teams, so a management UI would add more
  product decisions than this change requires.

Alternatives considered:
- Add role changes or member removal now. Rejected because it expands scope into authorization, confirmation flows,
  cache invalidation, and extra UX work.

### 3. Render roles as generic badges, not as a hard-coded enum

The UI will parse the stored comma-separated role string and render each role label individually.

Rationale:
- Better Auth supports multiple roles per member.
- The app currently uses default roles, but future changes may introduce custom roles.
- Treating roles as labels avoids baking temporary assumptions into the UI layer.

Alternatives considered:
- Display a single normalized role. Rejected because it breaks multi-role compatibility.

### 4. Keep the page server-rendered and route-scoped

The users page will continue to resolve organization access from the existing settings route context and render the
member list on the server.

Rationale:
- Existing settings pages already use server route loaders and canonical organization-key redirects.
- The page is primarily a read surface, so client-side fetching adds no clear benefit.
- Server rendering keeps authorization and data minimization close to the loader.

Alternatives considered:
- Fetch members from a client component with the auth client. Rejected because it duplicates route authorization and
  adds state-management complexity for a static first version.

### 5. Separate the current user from the tabular member list

The page will keep the current user visually distinct and render all other workspace members in a table.

Rationale:
- The user asked for the member list to become easier to scan when reviewing colleagues rather than themselves.
- A table fits repeated member attributes like name, email, roles, and joined date better than a generic stacked list.
- Keeping the current user separate preserves the existing “you are here” emphasis without forcing a special-case row
  into the table.

Alternatives considered:
- Render every member, including the current user, in the same table. Rejected because it weakens the self-identifying
  treatment already called for by the spec.

## Risks / Trade-offs

- [Repository logic can drift from Better Auth permission behavior] → Keep this change scoped to the current
  requirement of “any accessible workspace member can read the member list” and revisit the loader if custom
  organization permissions are introduced later.
- [Role strings may contain unexpected or custom values] → Render all parsed labels defensively and avoid enum-only
  assumptions in copy or styling.
- [A read-only page may not satisfy future admin workflows] → Treat this as the foundation for later invitations and
  role-management changes instead of overloading the initial release.
- [Member ordering can feel arbitrary] → Use a deterministic default ordering in the repository and cover it with tests.
- [Two presentations can complicate empty-state handling] → Define whether the page should show only the self panel,
  only the table, or both, based on whether any non-self members exist.

## Migration Plan

No database migration is required.

Deployment path:
1. Ship the new repository/query and users page UI.
2. Replace the placeholder rendering on `/[organizationKey]/settings/users`.
3. Verify route behavior and localized copy through existing Jest coverage plus focused users-page tests.

Rollback path:
1. Restore the previous placeholder page implementation for the users route.
2. Remove the new repository/query and UI components if needed.

## Open Questions

- Should the first version order members alphabetically, by role priority, or by join date?
- Should the page expose only active members, or also reserve space for future invitation counts/navigation hints?
- Do we want a dedicated DTO under `features/organizations`, or should the first implementation keep the member list
  types local to the workspace settings surface?
- Should the current user remain above the table as a compact summary card, or as a dedicated non-tabular list row?
