## MODIFIED Requirements

### Requirement: Workspace Settings Expose Planned Organization Management Sections

The system MUST expose dedicated workspace settings pages for workspace settings, users, teams, and roles to all
accessible workspace members, while exposing the invitations section only to members who can manage invitations.

#### Scenario: Workspace settings and users sections are available to accessible members

- **WHEN** an authenticated user opens the workspace settings navigation
- **THEN** the menu includes a workspace settings section page for the current workspace
- **AND** the menu includes the users section page

#### Scenario: Invitations section is visible to members with invitation-create permission

- **WHEN** an authenticated workspace member with invitation-create permission opens the workspace settings navigation
- **THEN** the menu includes the invitations section page
- **AND** that page renders its implemented invitation management UI instead of placeholder copy

#### Scenario: Invitations section is hidden from regular members

- **WHEN** an authenticated workspace member without invitation-create permission opens the workspace settings navigation
- **THEN** the menu does not include the invitations section page

#### Scenario: Teams section renders implemented management surface

- **WHEN** an authenticated user opens the workspace settings navigation
- **THEN** the menu includes the teams section page
- **AND** that page renders its implemented Better Auth Teams management UI instead of placeholder copy

#### Scenario: Future roles section remains visible before implementation

- **WHEN** an authenticated user opens the workspace settings navigation
- **THEN** the menu still includes the roles section page
- **AND** that section has its own route even if the section is not yet implemented

#### Scenario: Unimplemented roles section renders stub content

- **WHEN** an authenticated user opens the roles page before that feature is implemented
- **THEN** the system renders a placeholder state for that section
- **AND** does not expose non-functional management controls on that page
