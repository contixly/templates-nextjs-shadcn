## MODIFIED Requirements

### Requirement: Workspace Settings Use Dedicated Section Pages

The system MUST provide an organization-scoped workspace settings area that uses dedicated pages with a vertical section
menu on the left and the selected section content on the right.

#### Scenario: Opening a workspace settings section

- **WHEN** an authenticated user opens any workspace settings route for an accessible workspace
- **THEN** the system renders the workspace settings shell with a left-side vertical menu
- **AND** renders the selected section page in the main content area
- **AND** that section page follows the shared settings-surface composition with a contextual intro before section
  islands

#### Scenario: Workspace settings root resolves to the first section

- **WHEN** an authenticated user opens the root workspace settings route for an accessible workspace
- **THEN** the system redirects the user to the workspace settings section page

#### Scenario: Active section is reflected in navigation

- **WHEN** an authenticated user views a specific workspace settings section page
- **THEN** the left-side menu marks the corresponding section as active
