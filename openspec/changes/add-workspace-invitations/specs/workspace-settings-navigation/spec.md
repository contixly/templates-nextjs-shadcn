## MODIFIED Requirements

### Requirement: Workspace Settings Expose Planned Organization Management Sections

The system MUST expose dedicated workspace settings pages for workspace settings, invitations, users, teams, and roles,
with implemented sections rendering functional management surfaces and unimplemented sections remaining placeholders.

#### Scenario: Workspace settings section is available

- **WHEN** an authenticated user opens the workspace settings navigation
- **THEN** the menu includes a workspace settings section page for editing the current workspace configuration

#### Scenario: Invitations and users sections are functional

- **WHEN** an authenticated user opens the workspace settings navigation
- **THEN** the menu includes invitations and users section pages
- **AND** each of those pages renders its implemented data and management UI instead of placeholder copy

#### Scenario: Future sections remain visible before implementation

- **WHEN** an authenticated user opens the workspace settings navigation
- **THEN** the menu still includes teams and roles section pages
- **AND** each section has its own route even if the section is not yet implemented

#### Scenario: Unimplemented sections render stub content

- **WHEN** an authenticated user opens the teams or roles page before those features are implemented
- **THEN** the system renders a placeholder state for that section
- **AND** does not expose non-functional management controls on that page
