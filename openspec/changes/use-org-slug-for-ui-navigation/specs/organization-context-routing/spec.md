## MODIFIED Requirements

### Requirement: Global Dashboard Resolves Organization Context
The system MUST treat `/dashboard` as a global entry point that resolves an organization context and redirects the user to `/:organizationKey/dashboard`, where `organizationKey` is the organization's slug when present and its ID otherwise.

#### Scenario: Dashboard redirects to the active organization
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session contains an `activeOrganizationId` that belongs to one of their accessible organizations
- **THEN** the system resolves that organization
- **AND** redirects the user to `/:organizationKey/dashboard` using the organization's slug when available

#### Scenario: Dashboard falls back to the default organization
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session has no valid `activeOrganizationId`
- **AND** they have an accessible organization with `isDefault = true`
- **THEN** the system resolves that default organization
- **AND** redirects the user to `/:organizationKey/dashboard` using the organization's slug when available

#### Scenario: Dashboard falls back deterministically when no active or default organization exists
- **WHEN** an authenticated user opens `/dashboard`
- **AND** they have accessible organizations
- **AND** none of them is selected as active or default
- **THEN** the system selects one organization deterministically
- **AND** redirects the user to `/:organizationKey/dashboard` using that organization's slug when available

#### Scenario: Dashboard sends users without workspaces to welcome
- **WHEN** an authenticated user opens `/dashboard`
- **AND** they do not belong to any accessible organization
- **THEN** the system redirects the user to the welcome experience

### Requirement: Organization-Scoped Routes Use URL Context
The system MUST treat the organization route key in `/:organizationKey/...` as the current workspace context for rendering organization-scoped pages, sidebar workspace labels, and breadcrumb workspace labels. The route key MAY be either an organization slug or an organization ID.

#### Scenario: Sidebar and breadcrumbs reflect the opened workspace
- **WHEN** an authenticated user opens a route under `/:organizationKey/...`
- **THEN** the application resolves the workspace context from the accessible organization whose slug or ID matches that route key
- **AND** the sidebar switcher label reflects that workspace
- **AND** the breadcrumb workspace label reflects that workspace

#### Scenario: Existing ID-based deep links remain valid
- **WHEN** an authenticated user opens an existing deep link whose organization route key matches an accessible organization's ID
- **THEN** the route resolves the same workspace context
- **AND** the page renders without requiring the link to be rewritten first

#### Scenario: Deep links do not rewrite active session context
- **WHEN** an authenticated user opens a deep link under another accessible organization route key
- **THEN** the route renders in the URL workspace context
- **AND** the system does not change `session.activeOrganizationId` unless the user switches workspaces explicitly

### Requirement: Organization Root Route Redirects After Access Validation
The system MUST validate access to `/:organizationKey` before redirecting the user to `/:organizationKey/dashboard`, resolving that route key from an accessible organization slug or ID and emitting the slug-preferred dashboard URL.

#### Scenario: Accessible organization root redirects to organization dashboard
- **WHEN** an authenticated user opens `/:organizationKey`
- **AND** the route key matches an organization they can access by slug or by ID
- **THEN** the route validates access
- **AND** redirects the user to `/:organizationKey/dashboard` using that organization's slug when available

#### Scenario: Inaccessible organization root renders forbidden state
- **WHEN** an authenticated user opens `/:organizationKey`
- **AND** the route key does not match any organization they can access
- **THEN** the route does not redirect
- **AND** renders the application's forbidden experience
