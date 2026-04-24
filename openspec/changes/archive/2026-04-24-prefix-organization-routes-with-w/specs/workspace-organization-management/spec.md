## MODIFIED Requirements

### Requirement: Workspace Creation Generates a Deduplicated Slug
The system MUST create workspaces by creating Better Auth organizations from a user-provided name and a generated deduplicated slug.

#### Scenario: Creating a workspace from name only
- **WHEN** an authenticated user submits a workspace creation form with a name
- **THEN** the system generates a slug from that name
- **AND** creates an organization with that name and slug
- **AND** does not accept or persist default workspace state for the organization

#### Scenario: Slug generation deduplicates collisions
- **WHEN** a generated slug is already taken
- **THEN** the system generates another slug deterministically
- **AND** retries until it produces an unused slug

#### Scenario: Creating a workspace updates active context
- **WHEN** an authenticated user successfully creates a workspace
- **THEN** the system updates `session.activeOrganizationId` to that organization
- **AND** redirects the user to `/w/:organizationKey/dashboard` using the generated workspace slug when available

### Requirement: Workspace Switching Is Explicit
The system MUST update active workspace context only through explicit user actions in workspace switching controls or settings.

#### Scenario: Sidebar switcher changes active workspace and navigates
- **WHEN** an authenticated user selects a workspace in the sidebar switcher
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to `/w/:organizationKey/dashboard` using the workspace slug when available

#### Scenario: Current workspace label follows URL context
- **WHEN** an authenticated user is viewing `/w/:organizationKey/...`
- **THEN** workspace switching controls label the current workspace using the accessible organization whose slug or ID matches that route key
- **AND** do not label a different workspace just because `session.activeOrganizationId` points elsewhere
