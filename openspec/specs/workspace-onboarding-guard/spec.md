# workspace-onboarding-guard Specification

## Purpose
TBD - created by archiving change replace-workspaces-with-organizations. Update Purpose after archive.
## Requirements
### Requirement: Zero-Workspace Users Receive a Reusable Onboarding Guard
The system MUST provide a reusable onboarding guard block for authenticated users who do not have access to any workspace.

#### Scenario: Welcome page offers workspace onboarding actions
- **WHEN** an authenticated user with zero accessible workspaces opens the welcome page
- **THEN** the page renders the onboarding guard block
- **AND** the block offers an action to create a workspace
- **AND** the block offers an invitation entry point for future join flows

#### Scenario: Organization-scoped routes render onboarding guard instead of app content
- **WHEN** an authenticated user with zero accessible workspaces opens a route under `/:organizationId/...`
- **THEN** the route does not render organization-scoped application content
- **AND** renders the onboarding guard block instead

### Requirement: Zero-Workspace Guard Does Not Block Global Management Pages
The system MUST keep non-organization global pages available even when the user has zero accessible workspaces.

#### Scenario: Workspace management page remains accessible
- **WHEN** an authenticated user with zero accessible workspaces opens `/workspaces`
- **THEN** the page renders successfully
- **AND** the user can start workspace creation from there

#### Scenario: Account pages remain accessible
- **WHEN** an authenticated user with zero accessible workspaces opens an account page
- **THEN** the page renders successfully
- **AND** the user is not redirected away by workspace guard logic

