# organization-context-routing Specification

## Purpose
TBD - created by archiving change replace-workspaces-with-organizations. Update Purpose after archive.
## Requirements
### Requirement: Global Dashboard Resolves Organization Context
The system MUST treat `/dashboard` as a global entry point that resolves an organization context and redirects the user to `/:organizationId/dashboard`.

#### Scenario: Dashboard redirects to the active organization
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session contains an `activeOrganizationId` that belongs to one of their accessible organizations
- **THEN** the system redirects the user to `/:activeOrganizationId/dashboard`

#### Scenario: Dashboard falls back to the default organization
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session has no valid `activeOrganizationId`
- **AND** they have an accessible organization with `isDefault = true`
- **THEN** the system redirects the user to `/:organizationId/dashboard` for that default organization

#### Scenario: Dashboard falls back deterministically when no active or default organization exists
- **WHEN** an authenticated user opens `/dashboard`
- **AND** they have accessible organizations
- **AND** none of them is selected as active or default
- **THEN** the system selects one organization deterministically
- **AND** redirects the user to `/:organizationId/dashboard` for that organization

#### Scenario: Dashboard sends users without workspaces to welcome
- **WHEN** an authenticated user opens `/dashboard`
- **AND** they do not belong to any accessible organization
- **THEN** the system redirects the user to the welcome experience

### Requirement: Organization-Scoped Routes Use URL Context
The system MUST treat `organizationId` in the route as the current workspace context for rendering organization-scoped pages, sidebar workspace labels, and breadcrumb workspace labels.

#### Scenario: Sidebar and breadcrumbs reflect the opened workspace
- **WHEN** an authenticated user opens a route under `/:organizationId/...`
- **THEN** the application resolves the workspace context from that `organizationId`
- **AND** the sidebar switcher label reflects that workspace
- **AND** the breadcrumb workspace label reflects that workspace

#### Scenario: Deep links do not rewrite active session context
- **WHEN** an authenticated user opens a deep link under another accessible `organizationId`
- **THEN** the route renders in the URL workspace context
- **AND** the system does not change `session.activeOrganizationId` unless the user switches workspaces explicitly

### Requirement: Organization Root Route Redirects After Access Validation
The system MUST validate access to `/:organizationId` before redirecting the user to `/:organizationId/dashboard`.

#### Scenario: Accessible organization root redirects to organization dashboard
- **WHEN** an authenticated user opens `/:organizationId`
- **AND** the organization belongs to one of their accessible organizations
- **THEN** the route validates access
- **AND** redirects the user to `/:organizationId/dashboard`

#### Scenario: Inaccessible organization root renders forbidden state
- **WHEN** an authenticated user opens `/:organizationId`
- **AND** the organization is not accessible to them
- **THEN** the route does not redirect
- **AND** renders the application's forbidden experience

