## Context

The application already exposes workspace users and invitations settings pages backed by Better Auth organizations.
Today, those pages can list current members, add an existing user by ID, and create invitations, but both mutation
flows hard-code the target role to `member`, and there is no way to change a member's role after they join.

The current auth configuration does not enable custom organization roles or dynamic access control. In practice, the
application currently works with Better Auth's built-in roles: `owner`, `admin`, and `member`. Better Auth's current
organization APIs already support role-aware invitation creation, direct member addition, and member-role updates, but
they do not enforce the exact same rules uniformly:

- `createInvitation` enforces invitation permission and blocks non-owners from inviting someone as `owner`.
- `updateMemberRole` enforces `member:update` and blocks non-owners from assigning or modifying the `owner` role.
- `addMember` is server-only and accepts a role, but it does not perform those session-based permission checks for the
  application.

This change touches workspace settings UI, validation schemas, protected server actions, permission/context loading,
cache invalidation, translations, and tests. A design document is warranted so the app does not drift away from Better
Auth's built-in role model while extending existing flows.

## Goals / Non-Goals

**Goals:**
- Allow authorized workspace admins to choose a built-in role when adding an existing user by ID.
- Allow authorized workspace admins to choose a built-in role when creating a workspace invitation.
- Allow authorized workspace admins to change an existing member's role from the workspace users table.
- Keep role assignment aligned with Better Auth's built-in permission model, especially the special treatment of
  `owner`.
- Preserve read-only visibility for regular workspace members and keep cache invalidation aligned with current
  repository/server-action patterns.

**Non-Goals:**
- Introducing custom roles, dynamic access control, or a role-definition management UI.
- Implementing the placeholder `/settings/roles` page as part of this change.
- Supporting multi-role composition in the admin UI, even though Better Auth can store comma-separated role strings.
- Adding member removal, invitation cancellation/resend changes, or self-service leave/demotion UX in this change.

## Decisions

### 1. Manage a fixed application role catalog based on Better Auth's built-in roles

The app will centralize a single manageable role catalog for workspace administration with the built-in Better Auth
roles `member`, `admin`, and `owner`.

That helper will also own the assignment policy:
- regular members cannot assign roles
- admins can assign `member` and `admin`
- owners can assign `member`, `admin`, and `owner`

Rationale:
- The current auth configuration does not register custom roles or dynamic access control, so runtime role discovery
  would add complexity without user value.
- The installed Better Auth package explicitly treats `owner` as special for invitation and role-update flows, so the
  app needs one consistent source of truth for which options should be shown and accepted.
- A shared helper keeps form schemas, UI selectors, and server actions synchronized.

Alternatives considered:
- Fetch roles dynamically from Better Auth. Rejected because the app does not currently enable dynamic access control
  and the request explicitly excludes new roles.
- Hard-code role options separately in each form. Rejected because UI and server validation would drift quickly.

### 2. Keep the admin UI single-role even though the storage model supports multiple roles

The role selectors for add-member, invitation creation, and role updates will accept one built-in role value at a
time. Read paths will continue to render stored role labels defensively from the underlying string so existing or
unexpected composite values still display safely.

Rationale:
- The request is framed as choosing or changing "a role", not building multi-role composition.
- A single-select control is a substantially simpler and clearer admin UX.
- The existing read model already tolerates comma-separated roles, so narrowing the mutation UI does not break display
  compatibility.

Alternatives considered:
- Expose multi-select role management now. Rejected because it expands product scope and test surface without being
  requested.

### 3. Route all three role-aware mutations through protected server actions, but use Better Auth primitives where they add value

The change will keep the app-owned protected server action pattern and update the existing actions as follows:

- `createWorkspaceInvitation` accepts a `role`, validates it against the shared role helper, then delegates to
  `auth.api.createInvitation` with session headers.
- `addWorkspaceMember` accepts a `role`, validates that the acting member is allowed to assign it, then delegates to
  `auth.api.addMember` instead of writing the `member` row directly through Prisma.
- A new `updateWorkspaceMemberRole` action validates access to the workspace, validates the requested role, and then
  delegates to `auth.api.updateMemberRole` with session headers.

The app will keep its current pre-checks for user existence, duplicate membership, and duplicate invitation UX, but it
will stop relying on raw `prisma.member.create` for the direct-add path.

Rationale:
- Better Auth already owns invitation and member-role mutation semantics, including creator-role protections and hooks.
- Switching the direct-add path to `auth.api.addMember` makes the app consistent with Better Auth membership limits and
  future organization hooks instead of bypassing them.
- Server actions remain the correct place for authentication, authorization, validation, logging, and cache
  invalidation per project conventions and Next.js guidance for mutations.

Alternatives considered:
- Keep direct member addition as a Prisma write. Rejected because it bypasses Better Auth membership-level behavior and
  makes the role-aware flows inconsistent.
- Call Better Auth directly from client components. Rejected because it would bypass the app's action result pattern,
  validation, logging, and cache invalidation rules.

### 4. Put role changes on user-table rows and keep the current-user panel informational

The users page will keep the current user in the existing dedicated summary panel. Role-changing controls will appear
on rows in the "other workspace users" table for rows the acting member is allowed to update.

Rationale:
- The request explicitly asks for role changes in the users table.
- Keeping the self card informational avoids mixing self-management edge cases into the first release, including
  demoting the only owner or editing the active user's own permissions inline.
- The table already concentrates repeated member attributes, so it is the natural place for a row-level role control.

Alternatives considered:
- Move everyone into the same editable table. Rejected because it regresses the existing current-user treatment and
  adds risky self-edit semantics.
- Create a separate roles page now. Rejected because the request is specifically about management from the users table,
  and the current roles route can remain a future placeholder.

### 5. Derive assignability in the app before mutation and still rely on Better Auth for final enforcement where available

The app will derive the acting member's current role for the workspace and use it to decide:
- which role options to render in forms
- whether a target row is editable
- whether a requested role is valid for the acting member

For invitation creation and role updates, Better Auth will still apply its own permission checks as the final gate. For
direct member addition, the app must enforce the creator-role restriction itself because `auth.api.addMember` is a
server-only primitive without the same session-based permission enforcement.

Rationale:
- This avoids presenting UI options that will always fail.
- It keeps the add-member path safe even though Better Auth's server primitive is more permissive than the app's
  product rules.
- It provides consistent UX across add, invite, and update flows.

Alternatives considered:
- Let the UI show all built-in roles and rely only on backend failures. Rejected because it would create noisy and
  predictable validation failures for admins who can never assign `owner`.

## Risks / Trade-offs

- [The app's assignable-role helper could drift from Better Auth semantics] → Keep the helper intentionally narrow to
  the current built-in roles and mirror Better Auth's creator-role rule in tests.
- [Legacy or unexpected multi-role values may not map cleanly to single-select controls] → Continue rendering stored
  role labels generically and limit edit controls to supported role values.
- [Direct add still depends on app-owned authorization because Better Auth's server primitive is permissive] → Validate
  acting-member permissions and allowed target role before calling `auth.api.addMember`, and cover the restriction with
  action tests.
- [Current-user self-editing is intentionally omitted] → Keep the first release focused on managing other members and
  revisit self-service role changes only if product requirements appear later.

## Migration Plan

No database migration is required.

Deployment path:
1. Add the shared workspace role helper and update schemas/types to carry a selected role through add-member and
   invitation forms.
2. Update the add-member and create-invitation server actions, and add the new member-role update action.
3. Extend workspace settings loaders and page components so authorized admins can see role selectors and row-level role
   controls.
4. Update translations and Jest coverage for role selection, role-change success paths, and rejection paths.

Rollback path:
1. Remove the role selector from add-member and invitation dialogs and restore the fixed `member` default.
2. Remove the row-level role update action/control from the users table.
3. Restore the previous add-member action implementation if necessary.

## Open Questions

- None at proposal time; the Better Auth owner-role semantics are sufficiently clear for the initial implementation.
