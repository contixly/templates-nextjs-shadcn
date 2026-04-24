## Why

The workspace settings navigation already exposes an invitations section, but it is still a placeholder, which blocks a
core collaboration workflow: adding people to a workspace. Better Auth already provides organization invitations and
direct member-add APIs, but the application does not yet expose the required UI or acceptance flow around those
primitives.

## What Changes

- Replace the workspace invitations placeholder page with a functional invitations management surface that lists all
  workspace invitations in a table with statuses and copy-link actions.
- Add a modal workflow on the invitations page that creates a new workspace invitation from an email address and
  immediately returns a shareable invitation URL.
- Add copy-link actions both immediately after invitation creation and from the invitations table.
- Add a direct add-member workflow on the workspace users page that lets an authorized workspace member add an existing
  user to the organization by user ID without sending an invitation.
- Keep the workspace settings and workspace users sections accessible to all workspace members, but render them in a
  read-only mode when the acting member lacks the corresponding mutation permission.
- Restrict the workspace invitations settings route, navigation entry, list, and copy-link actions to workspace
  members who can manage invitations.
- Keep workspace deletion owner-only across workspace settings and workspace management entry points.
- Add a composite uniqueness guarantee on workspace memberships for `(organizationId, userId)` so concurrent add or
  accept flows cannot create duplicate membership rows.
- Add a dedicated invitation acceptance route that survives login redirects and lets the invited user accept or reject
  the invitation after authentication.
- Add account-scoped invitation surfaces so users can review invitations addressed to them on a dedicated personal page
  and in a reusable block on the welcome page when any actionable invitations exist.
- On this change, require the invitation email to match the user’s verified primary email before the invitation can be
  accepted; otherwise the acceptance UI shows an explicit mismatch or verification error.
- Add translations and tests for the new invitation and membership flows.

## Capabilities

### New Capabilities
- `workspace-invitation-management`: Workspace admins can create, review, share, and process workspace invitations from
  the workspace admin surface, while authenticated users can still review and respond to invitations addressed to their
  account email from personal invitation surfaces.

### Modified Capabilities
- `workspace-settings-navigation`: The invitations section stops being a placeholder and becomes a functional
  workspace-admin section that is visible only to members who can manage invitations, while workspace settings and
  users remain visible to all accessible members and only still-unimplemented sections remain placeholders.
- `workspace-user-management`: The users page is no longer fully read-only for admins and owners; it now exposes a
  direct add-member-by-user-ID workflow while preserving a read-only membership view for regular members and still
  keeping role edits and removals out of scope.
- `workspace-organization-management`: The dedicated workspace settings page becomes capability-aware so regular members
  can inspect workspace configuration in read-only form, admins and owners can update it, and only owners can access
  deletion controls.
- `workspace-onboarding-guard`: Welcome and zero-workspace onboarding surfaces expose real invitation-entry content
  when the current user has pending invitations instead of only a future placeholder action.

## Impact

- Affected code: workspace settings routes and page loaders, users and invitations page components, invitation
  acceptance routes, account/welcome surfaces, organization/workspace repositories, workspace management cards,
  server actions, auth configuration, and localized message bundles.
- Affected systems: Better Auth organization invitations, organization membership management, workspace administration
  UI, role-aware workspace settings navigation, and cache invalidation for organization-scoped reads.
- Data model impact: Prisma schema migration is required to add a composite unique constraint for workspace memberships
  on `(organizationId, userId)`.
- Dependencies: no new product dependency is required; the change builds on the existing Better Auth organization
  plugin and Prisma-backed auth schema.
