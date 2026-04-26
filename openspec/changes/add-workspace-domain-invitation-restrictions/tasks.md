## 1. Domain Restriction Foundation

- [ ] 1.1 Read the relevant Next.js docs in `node_modules/next/dist/docs/` for Server Actions, caching, and revalidation before coding.
- [ ] 1.2 Add a workspace domain-restriction helper module that normalizes domain input, extracts email domains, reads/writes the allowed-domain metadata key, and evaluates eligibility.
- [ ] 1.3 Add unit tests for domain normalization, deduplication, exact matching, disabled restrictions, and invalid domain values.

## 2. Workspace Settings Configuration

- [ ] 2.1 Extend workspace settings schemas and types so updates can include an optional allowed email-domain list.
- [ ] 2.2 Update the workspace settings action to authorize domain changes, merge the normalized list into organization metadata, and invalidate workspace and member cache tags.
- [ ] 2.3 Update the workspace settings UI to show the allowed-domain setting in read-only mode for regular members and editable mode for members with organization-update permission.
- [ ] 2.4 Add localized settings copy and validation errors for allowed-domain restrictions.
- [ ] 2.5 Add tests for authorized updates, clearing restrictions, invalid domains, and unauthorized direct update attempts.

## 3. Invitation Enforcement

- [ ] 3.1 Update invitation creation to reject recipient emails whose domain is outside the workspace's active restrictions before creating the Better Auth invitation.
- [ ] 3.2 Update invitation decision loading and acceptance to return a domain-restriction state when a pending invitation no longer satisfies active restrictions.
- [ ] 3.3 Update invitation decision UI and localized copy for the domain-restriction state.
- [ ] 3.4 Add tests for allowed invitation creation, restricted invitation rejection, unrestricted workspaces, and acceptance blocked after restrictions change.

## 4. Direct Member Add And Users Table Warnings

- [ ] 4.1 Extend the add-member schema/action with an acknowledgement flag for domain-restriction overrides.
- [ ] 4.2 Update direct add-by-user-ID so an out-of-policy target returns a warning without creating membership until the admin acknowledges the override.
- [ ] 4.3 Update the add-member dialog to render the warning, preserve the submitted user ID and role, and resubmit with acknowledgement when confirmed.
- [ ] 4.4 Derive member domain-policy status in the users page context and pass out-of-policy markers to the users table.
- [ ] 4.5 Update the users settings UI to render a page-level warning and row markers for members outside active restrictions.
- [ ] 4.6 Add localized warning copy for direct add override and existing out-of-policy members.
- [ ] 4.7 Add tests for direct-add warning, acknowledged override, invalid target handling, disabled restrictions, and users-table markers.

## 5. Verification

- [ ] 5.1 Run the targeted Jest tests for workspaces, invitations, settings, and localization changes.
- [ ] 5.2 Run `npm run lint`.
- [ ] 5.3 Run `npm run test` or document any skipped suites with the reason.
- [ ] 5.4 Run `openspec status --change "add-workspace-domain-invitation-restrictions"` and confirm the change is apply-ready.
