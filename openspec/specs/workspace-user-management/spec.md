# workspace-user-management Specification

## Purpose
TBD - created by archiving change add-workspace-users-list. Update Purpose after archive.
## Requirements
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
The system MUST keep the workspace users settings page readable to all accessible workspace members while limiting
management actions to the separately specified admin-only add-member workflow. Role edits and member removal MUST
remain out of scope for this release.

**Reason**: The users page now needs a limited admin add-member workflow without losing read-only visibility for regular
members.
**Migration**: Workspace members without member-create permission continue to use the users page as a read-only member
directory, while admins and owners gain the add-member modal; role edits and member removal remain out of scope.

#### Scenario: Regular members keep read-only access
- **WHEN** an authenticated workspace member without member-create permission opens the users settings page
- **THEN** the system renders the existing membership information in read-only mode
- **AND** does not expose role-editing or member-removal controls

### Requirement: Workspace Users Settings Page Supports Direct Member Addition
The system MUST allow an authorized workspace member to add an existing user to the workspace directly from the users
settings surface by providing a user ID.

#### Scenario: Authorized workspace admin sees add-member control
- **WHEN** an authenticated workspace member with member-create permission opens the users settings page
- **THEN** the system renders an add-member-by-user-ID control within the users management surface
- **AND** the control opens a modal that accepts a user ID

#### Scenario: Adding an existing user succeeds
- **WHEN** an authorized workspace member submits the ID of an existing user who is not yet a member of the workspace
- **THEN** the system adds that user to the underlying organization with the default `member` role
- **AND** refreshes the users page so the new member appears in the member list

#### Scenario: Invalid or redundant add-member request is rejected
- **WHEN** an authorized workspace member submits a user ID that does not exist or already belongs to a current
  workspace member
- **THEN** the system rejects the request
- **AND** surfaces a validation error without creating a duplicate membership

#### Scenario: Unauthorized workspace member cannot add users directly
- **WHEN** an authenticated workspace member without member-create permission opens the users settings page
- **THEN** the system still renders the current membership information in read-only mode
- **AND** does not render the add-member-by-user-ID control
- **AND** does not allow the direct add-member mutation to succeed

#### Scenario: Role edits and removals remain out of scope
- **WHEN** an authenticated user opens the users settings page after this change
- **THEN** the system still does not render controls for changing member roles or removing members
- **AND** keeps those workflows for later changes

