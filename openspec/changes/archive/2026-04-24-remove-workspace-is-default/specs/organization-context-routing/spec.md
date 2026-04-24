## MODIFIED Requirements

### Requirement: Global Dashboard Resolves Organization Context
The system MUST treat `/dashboard` as a global entry point that resolves an organization context and redirects the user to `/:organizationKey/dashboard`, where `organizationKey` is the organization's slug when present and its ID otherwise.

#### Scenario: Dashboard redirects to the active organization
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session contains an `activeOrganizationId` that belongs to one of their accessible organizations
- **THEN** the system resolves that organization
- **AND** redirects the user to `/:organizationKey/dashboard` using the organization's slug when available

#### Scenario: Dashboard falls back deterministically when no valid active organization exists
- **WHEN** an authenticated user opens `/dashboard`
- **AND** their session has no `activeOrganizationId` or has an `activeOrganizationId` that is not accessible
- **AND** they have at least one accessible organization
- **THEN** the system selects the first organization from the deterministic accessible-organization order
- **AND** redirects the user to `/:organizationKey/dashboard` using that organization's slug when available

#### Scenario: Dashboard sends users without workspaces to welcome
- **WHEN** an authenticated user opens `/dashboard`
- **AND** they do not belong to any accessible organization
- **THEN** the system redirects the user to the welcome experience
