## Why

The workspace settings navigation already exposes a `/settings/users` section, but the page is still a placeholder.
At the same time, the application already stores organization membership through Better Auth, so the next low-risk step
is to make the users section useful and validate that the current organization model can power a real member list.

## What Changes

- Replace the workspace users placeholder page with a functional, read-only users list for the current workspace.
- Load workspace users from the Better Auth organization membership data already persisted in `organizations`,
  `members`, and `users`.
- Render essential member information on the page: avatar, display name, email, role labels, joined date, and a
  visible marker for the current user.
- Add an explicit empty state for organizations that return no members instead of falling back to placeholder copy.
- Keep invitations, role updates, member removal, and team management out of scope for this change.
- Add translations and tests for the new users page behavior.

## Capabilities

### New Capabilities
- `workspace-user-management`: Workspace settings expose a read-only user list backed by Better Auth organization
  members.

### Modified Capabilities

## Impact

- Affected code: `src/app/(protected)/(global)/[organizationKey]/settings/users/page.tsx`, workspace settings page
  components, organization/workspace data access, translations, and tests.
- Affected systems: workspace administration UI, Better Auth organization membership data, repository caching for
  organization-scoped reads.
- Dependencies: no new runtime dependencies are expected; the change relies on the existing Better Auth organization
  plugin and Prisma-backed membership schema.
