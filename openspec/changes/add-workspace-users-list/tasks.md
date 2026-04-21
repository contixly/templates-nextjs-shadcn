## 1. Data Loading

- [ ] 1.1 Add organization member types and a repository query that returns workspace user list data from `member` and
  `user` records for an accessible organization.
- [ ] 1.2 Add a server-side loader for the workspace users settings page that composes canonical workspace context with
  the organization member list.

## 2. Users Page UI

- [ ] 2.1 Replace the users placeholder page with a dedicated read-only workspace users page component.
- [ ] 2.2 Render member avatar, name, email, role badges, joined date, and a clear marker for the current user.
- [ ] 2.3 Add an empty state and localized copy for the users page in both Russian and English message bundles.

## 3. Verification

- [ ] 3.1 Add or update tests for the users page route, data loading, and rendered member list states.
- [ ] 3.2 Run the focused test suite for workspace settings and organization-backed data loading.
