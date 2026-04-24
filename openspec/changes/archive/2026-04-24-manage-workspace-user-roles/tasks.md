## 1. Shared role model

- [x] 1.1 Add a shared workspace role helper that defines the built-in manageable roles, labels, and assignability rules for `member`, `admin`, and `owner`
- [x] 1.2 Extend workspace role-related schemas/types so add-member, invitation-creation, and member-role-update mutations all accept a selected role

## 2. Server actions and page context

- [x] 2.1 Update the direct add-member action to validate the requested role, enforce app-level assignment rules, call `auth.api.addMember`, and invalidate affected member/workspace caches
- [x] 2.2 Update the create-invitation action to accept a selected role, validate it against the shared role helper, and continue returning the created invitation DTO with refreshed invitation caches
- [x] 2.3 Add a protected member-role update action that validates row editability, delegates to `auth.api.updateMemberRole`, and refreshes member caches
- [x] 2.4 Extend workspace settings users/invitations page context loading with the current member role and separate capability flags needed to render role-aware controls safely

## 3. Workspace settings UI

- [x] 3.1 Update the add-member dialog and invitation dialog to include a role selector and surface role-related validation errors
- [x] 3.2 Add row-level role-changing controls to the workspace users table while keeping the current-user summary informational
- [x] 3.3 Update localized copy and role labels for the users and invitations settings flows in all supported message bundles
- [x] 3.4 Refine the workspace users table so editable role selectors replace the role display inside the `Roles` column, while read-only/unsupported rows continue rendering role labels there and no separate role-action column is shown

## 4. Verification

- [x] 4.1 Add or update action tests for role-aware add-member, invitation creation, and member-role updates, including non-owner attempts to assign `owner`
- [x] 4.2 Add or update page/component tests covering dialog role selection, read-only behavior, and row-level role editing on the users page
- [x] 4.3 Run the targeted Jest coverage for workspace actions and settings pages and fix any regressions
- [x] 4.4 Update users-page component tests for the single `Roles` column behavior and rerun targeted workspace coverage
