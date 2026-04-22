## MODIFIED Requirements

### Requirement: Zero-Workspace Users Receive a Reusable Onboarding Guard
The system MUST provide a reusable onboarding guard block for authenticated users who do not have access to any
workspace. The guard MUST keep workspace creation available and MUST expose an actionable invitation entry instead of a
future-placeholder control.

#### Scenario: Welcome page offers workspace onboarding actions
- **WHEN** an authenticated user with zero accessible workspaces opens the welcome page
- **THEN** the page renders the onboarding guard block
- **AND** the block offers an action to create a workspace
- **AND** the block offers an invitation entry action instead of a disabled future-flow placeholder

#### Scenario: Pending invitations are surfaced from the onboarding experience
- **WHEN** an authenticated user with zero accessible workspaces opens the welcome page and has pending invitations
- **THEN** the onboarding experience exposes those invitations through the invitation entry action or adjacent invitation
  block
- **AND** each invitation leads to the invitation decision surface

#### Scenario: Organization-scoped routes render onboarding guard instead of app content
- **WHEN** an authenticated user with zero accessible workspaces opens a route under `/:organizationId/...`
- **THEN** the route does not render organization-scoped application content
- **AND** renders the onboarding guard block with the same invitation entry action
