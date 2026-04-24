# organization-context-routing Specification

## Purpose
TBD - created by archiving change replace-workspaces-with-organizations. Update Purpose after archive.
## Requirements
### Requirement: Global Dashboard Resolves Organization Context
The system MUST treat `/dashboard` as a global entry point that resolves an organization context and redirects the user to `/w/:organizationKey/dashboard`, where `organizationKey` is the organization's slug when present and its ID otherwise.

#### Scenario: Dashboard redirects to the active organization
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session contains an `activeOrganizationId` that belongs to one of their accessible organizations
- **THEN** the system resolves that organization
- **AND** redirects the user to `/w/:organizationKey/dashboard` using the organization's slug when available

#### Scenario: Dashboard falls back deterministically when no valid active organization exists
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session has no `activeOrganizationId` or has an `activeOrganizationId` that is not accessible
- **AND** they have at least one accessible organization
- **THEN** the system selects the first organization from the deterministic accessible-organization order
- **AND** redirects the user to `/w/:organizationKey/dashboard` using that organization's slug when available

#### Scenario: Dashboard sends users without workspaces to welcome
- **WHEN** an authenticated user opens `/dashboard`
- **AND** they do not belong to any accessible organization
- **THEN** the system redirects the user to the welcome experience

### Requirement: Organization-Scoped Routes Use URL Context
The system MUST treat the organization route key in `/w/:organizationKey/...` as the current workspace context for rendering organization-scoped pages, sidebar workspace labels, and breadcrumb workspace labels. The route key MAY be either an organization slug or an organization ID.

#### Scenario: Sidebar and breadcrumbs reflect the opened workspace
- **WHEN** an authenticated user opens a route under `/w/:organizationKey/...`
- **THEN** the application resolves the workspace context from the accessible organization whose slug or ID matches that route key
- **AND** the sidebar switcher label reflects that workspace
- **AND** the breadcrumb workspace label reflects that workspace

#### Scenario: Existing ID-based deep links remain valid under the workspace prefix
- **WHEN** an authenticated user opens an existing deep link under `/w/:organizationKey/...` whose organization route key matches an accessible organization's ID
- **THEN** the route resolves the same workspace context
- **AND** the page renders without requiring the link to be rewritten first

#### Scenario: Deep links do not rewrite active session context
- **WHEN** an authenticated user opens a deep link under another accessible organization route key
- **THEN** the route renders in the URL workspace context
- **AND** the system does not change `session.activeOrganizationId` unless the user switches workspaces explicitly

### Requirement: Organization Root Route Redirects After Access Validation
The system MUST validate access to `/w/:organizationKey` before redirecting the user to `/w/:organizationKey/dashboard`, resolving that route key from an accessible organization slug or ID and emitting the slug-preferred dashboard URL.

#### Scenario: Accessible organization root redirects to organization dashboard
- **WHEN** an authenticated user opens `/w/:organizationKey`
- **AND** the route key matches an organization they can access by slug or by ID
- **THEN** the route validates access
- **AND** redirects the user to `/w/:organizationKey/dashboard` using that organization's slug when available

#### Scenario: Inaccessible organization root renders forbidden state
- **WHEN** an authenticated user opens `/w/:organizationKey`
- **AND** the route key does not match any organization they can access
- **THEN** the route does not redirect
- **AND** renders the application's forbidden experience
