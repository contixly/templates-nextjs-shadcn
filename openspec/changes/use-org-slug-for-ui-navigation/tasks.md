## 1. Route Identity Foundations

- [ ] 1.1 Introduce shared organization route-key helpers that derive a slug-preferred `organizationKey` from workspace/organization data.
- [ ] 1.2 Update route param typings and feature route definitions so organization-scoped pages build URLs from `organizationKey` instead of assuming raw `organizationId` path segments.
- [ ] 1.3 Add organization lookup helpers that resolve an accessible workspace from either an incoming slug or an incoming organization ID.

## 2. Organization Route Resolution

- [ ] 2.1 Update the global `/dashboard` resolution flow to keep selecting organizations by canonical ID but redirect with the slug-preferred route key.
- [ ] 2.2 Update the `/:organizationKey` root handoff, dashboard page, metadata loaders, and route guard logic to accept slug-or-ID route params.
- [ ] 2.3 Preserve backward compatibility for existing ID-based deep links without rewriting active workspace session context implicitly.

## 3. Workspace Navigation Surfaces

- [ ] 3.1 Update workspace create, switcher, and management navigation flows to use the shared slug-preferred organization route key.
- [ ] 3.2 Ensure current-workspace labels in navigation and breadcrumbs resolve from the route key instead of assuming the URL segment is always an organization ID.
- [ ] 3.3 Update slug-edit flows so subsequent generated workspace links and redirects use the newly saved slug.

## 4. Verification

- [ ] 4.1 Add or update tests for dashboard redirects, organization route guards, and organization root redirects with both slug-based and ID-based URLs.
- [ ] 4.2 Add or update navigation tests covering workspace creation, workspace switching, and slug update flows that should emit slug-preferred URLs.
- [ ] 4.3 Run the relevant lint and test suites for organizations, dashboard routing, and workspace navigation.
