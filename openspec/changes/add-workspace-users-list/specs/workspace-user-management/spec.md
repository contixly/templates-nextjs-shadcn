## ADDED Requirements

### Requirement: Workspace Users Settings Page Lists Organization Members
The system MUST render the workspace users settings section from the Better Auth organization members associated with
the current workspace.

#### Scenario: Accessible workspace renders its users
- **WHEN** an authenticated user opens the users settings page for a workspace they can access
- **THEN** the system loads the members of the underlying organization
- **AND** renders each member with display name, email, role labels, and joined-at information

#### Scenario: Current user is identifiable in the list
- **WHEN** an authenticated user opens the users settings page for an accessible workspace
- **THEN** the system highlights which listed member corresponds to the current user

#### Scenario: Other workspace users are shown in a table
- **WHEN** an authenticated user opens the users settings page and the workspace contains members other than the
  current user
- **THEN** the system renders those other members in a tabular layout
- **AND** preserves the current user as a separately identifiable item rather than merging that item into the generic
  table presentation

#### Scenario: No members returned for the workspace
- **WHEN** the users settings page loads for an accessible workspace and no members are returned
- **THEN** the system renders an explicit empty state
- **AND** does not render the generic placeholder copy used before this change

### Requirement: Workspace Users Settings Page Is Read-Only In The Initial Release
The system MUST expose the workspace users settings section as a read-only surface in the initial release.

#### Scenario: Management controls stay out of scope
- **WHEN** an authenticated user views the workspace users settings page
- **THEN** the system does not render controls for inviting users, changing roles, or removing members
- **AND** keeps those workflows for separate settings sections or future changes

#### Scenario: Multiple or custom roles remain displayable
- **WHEN** a workspace member has one or more stored role labels
- **THEN** the system renders the available role labels for that member
- **AND** does not assume the role set is limited to a single hard-coded value
