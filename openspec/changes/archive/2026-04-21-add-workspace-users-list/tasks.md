## 1. Data Loading

- [x] 1.1 Add organization member types and a repository query that returns workspace user list data from `member` and
  `user` records for an accessible organization.
- [x] 1.2 Add a server-side loader for the workspace users settings page that composes canonical workspace context with
  the organization member list.

## 2. Users Page UI

- [x] 2.1 Replace the users placeholder page with a dedicated read-only workspace users page component.
- [x] 2.2 Render member avatar, name, email, role badges, joined date, and a clear marker for the current user.
- [x] 2.3 Add an empty state and localized copy for the users page in both Russian and English message bundles.
- [x] 2.4 Render members other than the current user in a tabular layout while keeping the current user visually
  separate.

## 3. Verification

- [x] 3.1 Add or update tests for the users page route, data loading, and rendered member list states.
- [x] 3.2 Run the focused test suite for workspace settings and organization-backed data loading.
- [x] 3.3 Update tests to cover the split presentation: current user outside the table and other members inside it.
