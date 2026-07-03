# workspace-onboarding-guard Specification

## Purpose
Define the reusable onboarding guard shown to authenticated users who do not have access to any workspace.

## Requirements
### Requirement: Zero-Workspace Users Receive a Reusable Onboarding Guard
The system MUST provide a reusable onboarding guard block for authenticated users who do not have access to any
workspace. The guard MUST keep workspace creation available and MUST expose an actionable invitation entry instead of a
future-placeholder control.

#### Scenario: Welcome page offers workspace onboarding actions
- **GIVEN** an authenticated user has zero accessible workspaces
- **WHEN** the user opens the welcome page
- **THEN** the page renders the onboarding guard block
- **AND** the block offers an action to create a workspace
- **AND** the block offers an invitation entry action instead of a disabled future-flow placeholder

#### Scenario: Pending invitations are surfaced from the onboarding experience
- **GIVEN** an authenticated user has zero accessible workspaces and one or more pending invitations
- **WHEN** the user opens the welcome page
- **THEN** the onboarding experience exposes those invitations through the invitation entry action or adjacent invitation
  block
- **AND** each invitation leads to the invitation decision surface

#### Scenario: Organization-scoped routes render onboarding guard instead of app content
- **GIVEN** an authenticated user has zero accessible workspaces
- **WHEN** the user opens an organization-scoped route under `/w/:organizationKey/...`
- **THEN** the route does not render organization-scoped application content
- **AND** renders the onboarding guard block with the same invitation entry action

### Requirement: Zero-Workspace Guard Does Not Block Global Management Pages
The system MUST keep non-organization global pages available even when the user has zero accessible workspaces.

#### Scenario: Workspace management page remains accessible
- **GIVEN** an authenticated user has zero accessible workspaces
- **WHEN** the user opens `/workspaces`
- **THEN** the page renders successfully
- **AND** the user can start workspace creation from there

#### Scenario: Account pages remain accessible
- **GIVEN** an authenticated user has zero accessible workspaces
- **WHEN** the user opens an account page
- **THEN** the page renders successfully
- **AND** the user is not redirected away by workspace guard logic
