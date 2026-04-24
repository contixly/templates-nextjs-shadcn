## Why

The workspace administration flow already lists members, supports direct add-by-user-ID, and supports invitation
creation, but all three flows still force the default `member` role and do not let admins adjust roles afterward. That
blocks the last practical step of workspace administration: assigning the correct built-in Better Auth role at invite
time, add-member time, and after membership already exists.

## What Changes

- Extend the workspace users page so authorized workspace admins can change an existing member's role directly from the
  users table.
- Extend the add-member-by-user-ID flow so an authorized admin chooses the role that will be assigned to the new
  member instead of always creating a `member` membership.
- Extend the create-invitation flow so an authorized admin chooses the invited role instead of always creating a
  `member` invitation.
- Keep the role catalog fixed to the built-in Better Auth roles already supported by the application configuration;
  this change does not introduce custom roles, dynamic access control, or a role-definition management UI.
- Keep workspace member and invitation surfaces permission-aware so regular members still get read-only visibility
  where already supported, while only authorized members can assign or change roles.
- Add translations and tests for role selection and role-update workflows.

## Capabilities

### New Capabilities

### Modified Capabilities

- `workspace-user-management`: the users page gains role assignment for direct member adds and role updates for
  existing members.
- `workspace-invitation-management`: invitation creation gains explicit role selection instead of always inviting as
  `member`.

## Impact

- Affected code: workspace users and invitations settings pages, member/invitation dialogs, workspace server actions,
  workspaces permission helpers, role-label DTO helpers, and localized message bundles.
- Affected systems: Better Auth organization member management (`addMember`, `updateMemberRole`) and invitation
  management (`createInvitation`) backed by the existing Prisma auth schema.
- Dependencies: no new product dependency is expected; the change continues to use the existing Better Auth
  organization plugin and its built-in roles.
