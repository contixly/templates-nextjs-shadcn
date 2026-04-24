## 1. Route Resolution

- [ ] 1.1 Re-read relevant Next.js App Router docs from `node_modules/next/dist/docs/` before implementation.
- [ ] 1.2 Add a shared workspace switch navigation helper that resolves the selected workspace's slug-preferred route key.
- [ ] 1.3 Make the helper preserve the matched route only when the registered path template has exactly one dynamic segment and that segment is `[organizationKey]`.
- [ ] 1.4 Make the helper return the selected workspace dashboard route for unknown routes and routes with additional dynamic identifiers.

## 2. Switcher Integration

- [ ] 2.1 Update the sidebar workspace switcher to read the current pathname and navigate through the shared helper after `setActiveOrganization` succeeds.
- [ ] 2.2 Update the breadcrumb workspace switcher to read the current pathname and navigate through the shared helper after `setActiveOrganization` succeeds.
- [ ] 2.3 Keep existing loading, dropdown closing, mobile sidebar, refresh, and failure toast behavior unchanged.

## 3. Verification

- [ ] 3.1 Add focused tests for preserving base workspace routes such as `/:organizationKey/settings/invitations`.
- [ ] 3.2 Add focused tests for dashboard fallback on routes with additional dynamic identifiers and on unknown routes.
- [ ] 3.3 Add or update component tests for both workspace switchers so header and sidebar navigation behavior stays aligned.
- [ ] 3.4 Run the relevant Jest tests and project linting.
