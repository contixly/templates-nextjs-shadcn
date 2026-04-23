## Context

The application already uses Better Auth organizations as the backing model for workspaces, and the workspace settings
navigation already includes an invitations route. That route is still a placeholder, while the users settings page is
currently a read-only list.

Better Auth already provides the core organization APIs this feature needs: `createInvitation`, `listInvitations`,
`getInvitation`, `acceptInvitation`, `rejectInvitation`, `listUserInvitations`, and `addMember`. The local package
installation confirms an important limitation, though: `getInvitation`, `acceptInvitation`, and `rejectInvitation`
authorize only against `session.user.email`, and `listUserInvitations` only returns pending invitations for that same
single email address. In this codebase, account linking explicitly allows different emails across providers, but the
current Prisma auth schema does not persist a normalized list of verified linked-account emails. The `accounts` table
stores provider IDs and tokens, not a durable `email` plus `emailVerified` contract. That means linked-account email
matching cannot be implemented reliably in this change without inventing new persistence rules; the first release must
therefore scope invitation acceptance to the verified primary email only.

The feature is also cross-cutting. It touches workspace settings UI, account/welcome flows, auth integration,
repository caching, and protected server actions. A design document is warranted before implementation so the change
does not drift away from Better Auth behavior or the project’s FSD-style structure.

## Goals / Non-Goals

**Goals:**
- Replace the workspace invitations placeholder with a functional admin page for listing and creating invitations.
- Add a direct add-member-by-user-ID flow on the workspace users page.
- Keep the workspace settings and workspace users pages readable to all workspace members while making only the
  mutation controls role-aware.
- Restrict the workspace invitations settings surface to admins and owners.
- Keep workspace deletion owner-only across settings and workspace management affordances.
- Provide a dedicated invitation route that survives login redirects and lets a user accept or reject an invitation.
- Let users review pending invitations addressed to their primary account email on a personal page and on the
  welcome page.
- Require invitation acceptance to use the verified primary email in the first release.
- Keep the implementation aligned with the current repository/cache/server-action patterns.

**Non-Goals:**
- Adding role selection, role editing, member removal, or invitation cancellation/resend controls in the first release.
- Sending invitation emails automatically; the required output is a copyable link.
- Enabling teams or custom access-control roles as part of this change.
- Reworking workspace navigation or non-invitation settings sections beyond what is needed to mount the new flows.

## Decisions

### 1. Build an application-owned admin UI on top of Better Auth invitation primitives

The app will use Better Auth organizations as the source of truth for organizations, members, and invitations, but the
workspace invitation UX will be implemented through application repositories, page loaders, and protected server
actions.

This means:
- Workspace settings reads will query Prisma-backed organization and invitation tables through app repositories so they
  can participate in the existing cache-tag strategy.
- Admin mutations such as “create invitation” and “add member by user ID” will be wrapped in protected server actions
  that enforce app-level validation and cache invalidation.
- The invitation decision route will remain app-controlled for routing and UX, but its accept/reject actions can
  delegate to Better Auth invitation endpoints because the first release aligns with Better Auth's primary-email model.

Rationale:
- The repository pattern is already used for workspace and organization data.
- The app needs derived invitation status, copy-link generation, and reusable DTOs for both workspace and current-user
  views.
- The app still needs route-level UX and data shaping even when the underlying invitation mutations come from Better
  Auth.

Alternatives considered:
- Use Better Auth client methods directly from client components. Rejected because page-level authorization/data loading
  would become inconsistent with the rest of the app.
- Call only Better Auth server APIs from route handlers. Rejected because the app still needs repository-level reads and
  page loaders for workspace settings data.

### 2. Scope recipient matching to the verified primary email

The first release will intentionally accept invitations only when:
- `invitation.email === session.user.email`
- `session.user.emailVerified === true`

The app should either enable Better Auth's `requireEmailVerificationOnInvitation` option or enforce the same rule in a
thin server action before delegating to Better Auth acceptance.

Rationale:
- This behavior is fully supported by the current Better Auth invitation contract.
- The current schema does not reliably expose alternate verified emails for linked accounts.
- It keeps the initial change implementable without introducing new persistence or provider-specific token parsing.

Alternatives considered:
- Inspect linked `accounts` records to discover alternate verified emails. Rejected because the current schema stores
  account IDs and tokens, not a normalized verified email field, so any account-by-account decoding would be partial and
  provider-specific.
- Add a new alias table now. Rejected for this stage because the user explicitly asked to avoid schema changes.

### 3. Use dedicated global invitation routes plus a personal invitations page

The change will add a global invitation decision route, for example `/invite/[invitationId]`, and a current-user
invitations page under the account area, for example `/user/invitations`. The welcome page will reuse the same pending
invitations block when invitations exist.

The route split is intentional:
- The workspace settings invitations page is an admin surface for a specific workspace.
- The invitation decision route must work before the user belongs to that workspace.
- The personal invitations page and welcome block are account-scoped, not workspace-scoped.

Rationale:
- A workspace-scoped invite route would be awkward for non-members because they do not yet have organization access.
- A dedicated personal page keeps the invitation review flow available even when the user leaves the welcome page.
- Reusing the same invitation block on welcome keeps the initial discovery path simple.

Alternatives considered:
- Put invitation acceptance only on `/welcome`. Rejected because invite links need a stable, shareable target.
- Show invitations only on the workspace admin page. Rejected because recipients often cannot access that page.

### 4. Keep role assignment fixed to `member` in the first release

Both “invite by email” and “add by user ID” will use the default workspace role `member` in the first implementation.
The modal inputs stay intentionally narrow: email for invitations, user ID for direct adds.

Rationale:
- The request defines only email and user-ID inputs.
- The existing product does not yet expose full role-management UI.
- Keeping a fixed role avoids mixing invitation delivery with broader authorization design.

Alternatives considered:
- Add a role selector now. Rejected because it expands the scope into role policy UX and validation.

### 5. Permission checks will align with Better Auth organization access semantics

The app will align workspace-facing routes, UI states, and server actions with Better Auth organization permissions,
while adding app-owned gates for product rules that Better Auth does not express directly.

This means:
- `/settings/workspace` remains accessible to any current workspace member, but only members with
  `organization:update` can edit workspace name, slug, or default-workspace state; everyone else sees the same values
  in a read-only presentation.
- `/settings/users` remains accessible to any current workspace member, but only members with `member:create` can add
  existing users.
- `/settings/invitations` becomes an admin surface. Members without `invitation:create` should not see its navigation
  entry and should receive a forbidden response if they open the route directly.
- Workspace deletion controls remain available only to members with `organization:delete`.
- Server actions should allow privileged mutations only when the acting member has the corresponding Better Auth
  permission:
  - workspace settings update: `organization:update`
  - workspace deletion: `organization:delete`
  - invitation page access, invitation list visibility, invitation link copying, and invitation creation:
    `invitation:create`
  - direct add-member: `member:create`

Under the default Better Auth organization roles, this means owners and admins can update workspace settings, add
members, and manage workspace invitations; only owners can delete the workspace; regular members can read the
workspace and users pages but cannot use administrative settings flows.

Rationale:
- The built-in workspace update and delete endpoints already enforce `organization:update` and `organization:delete`,
  so the app should surface those capabilities explicitly in the UI instead of letting members discover them only via a
  failed mutation.
- The built-in invitation list endpoint only checks organization membership and does not model a separate
  invitation-read permission, so the app must enforce the stricter admin-only invitations surface in loaders,
  navigation, and UI.
- The built-in `addMember` endpoint is looser than the app needs, so the app must make the permission rule explicit
  for direct adds.

Alternatives considered:
- Let any current workspace member invite or review invitation history. Rejected because it exposes invitation
  administration artifacts, including shareable links, to regular members.
- Make the workspace and users pages admin-only too. Rejected because members still need to inspect workspace metadata
  and membership without being able to mutate them.

### 6. Derive display status and invitation links in the app layer

Invitation rows will expose an app DTO with:
- stored Better Auth status
- derived display status that treats `pending + expiresAt < now` as `expired`
- copyable invitation URL built from the app’s canonical invitation route

Rationale:
- Better Auth stores only raw invitation state; the UI needs a friendlier status model.
- Copy-link actions should not require email delivery infrastructure.

Alternatives considered:
- Show raw status only. Rejected because expired pending invitations would look actionable when they are not.

### 7. Add a database-level uniqueness guarantee for workspace memberships

The `members` table will gain a composite unique constraint on `(organizationId, userId)`.

Rationale:
- Both invitation acceptance and direct add-member flows create organization memberships.
- Application-level pre-checks reduce common duplicates but do not fully protect against concurrent requests.
- A database-level invariant keeps membership data correct even if two valid requests race.

Alternatives considered:
- Keep race protection only in application code. Rejected because concurrent accept/add flows can still pass read checks
  before either insert commits.

## Risks / Trade-offs

- [Users invited to a non-primary linked email cannot accept in the first release] → Make the limitation explicit in the
  spec and UI copy, and treat linked-account acceptance as a later change once a durable email model exists.
- [Primary-email verification may be disabled accidentally in config] → Enable the Better Auth verification requirement
  for invitations or assert the same check in the server action and cover it with tests.
- [Direct add and accept flows can race with other membership mutations] → Add the composite unique constraint on
  `(organizationId, userId)`, keep pre-checks for better UX, and handle unique-violation errors gracefully.
- [Invitation lists can diverge between Better Auth helper methods and app repositories] → Make the app repository the
  canonical source for UI surfaces, while keeping its filtering rules aligned with Better Auth’s pending-invitation
  semantics where applicable.
- [Role-aware route gating can drift from UI capability flags] → Derive the relevant workspace capability flags in page
  loaders and use them consistently for navigation, page rendering, and mutation entry points.

## Migration Plan

1. Add the Prisma migration for the composite unique constraint on workspace memberships
   `(organizationId, userId)`.
2. Implement repositories, DTOs, loaders, and protected server actions for workspace invitation management, direct
   member addition, capability-aware workspace settings surfaces, and invitation acceptance/rejection around the
   existing Better Auth invitation schema.
3. Update Better Auth invitation acceptance configuration or server-action checks so only a verified primary email can
   accept or reject invitations.
4. Replace the invitations placeholder page, add the personal invitations page and invite route, mount the reusable
   pending-invitations block on welcome, and make the workspace settings shell role-aware.
5. Add/update tests for workspace settings read-only behavior, admin-only invitation surfaces, owner-only deletion
   affordances, invitation decision flows, primary-email verification, duplicate-membership protection, and
   welcome/account invitation surfaces.

Rollback path:
1. Restore the invitations placeholder and remove the new user-facing routes/actions.
2. Revert any invitation-specific auth configuration changes if needed.
3. Roll back the membership uniqueness migration only if duplicate-member writes must be re-enabled temporarily.
