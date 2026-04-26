## Why

Workspace administrators need a controlled way to limit who can join a workspace through invitations or direct member
addition. Domain-based eligibility gives teams a lightweight guardrail for organization-owned email domains while still
making existing out-of-policy members visible instead of silently breaking access.

## What Changes

- Add optional workspace-level email-domain restrictions that can be configured from workspace settings.
- Enforce configured domain restrictions when creating workspace invitations by recipient email.
- Enforce configured domain restrictions when accepting invitations so stale or bypassed invitations cannot add an
  ineligible user.
- Check configured domain restrictions when directly adding an existing user by user ID and return a warning-oriented
  response when the target user does not match the policy.
- Mark existing workspace members whose email domains do not match the configured restrictions in the users table.
- Render a workspace users-page warning when one or more current members fall outside the active domain restrictions.

## Capabilities

### New Capabilities

### Modified Capabilities

- `workspace-organization-management`: Workspace settings gain optional email-domain restriction configuration.
- `workspace-invitation-management`: Invitation creation and acceptance must honor configured workspace email-domain
  restrictions.
- `workspace-user-management`: Direct member addition and the users table must surface domain-restriction warnings for
  ineligible users and existing out-of-policy members.

## Impact

- Affects workspace metadata persistence for storing normalized allowed email domains.
- Affects workspace settings actions, schemas, repositories, cache tags, and settings UI.
- Affects invitation creation, invitation acceptance, direct member addition, and workspace member listing flows.
- Affects localized copy for settings, validation errors, warnings, and user-table badges.
- Adds repository/action/component tests for restriction validation, warnings, and member-table indicators.
