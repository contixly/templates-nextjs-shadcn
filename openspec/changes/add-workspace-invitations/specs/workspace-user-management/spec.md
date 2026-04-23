## MODIFIED Requirements

### Requirement: Workspace Users Settings Page Is Read-Only In The Initial Release
**Reason**: The users page now needs a limited admin add-member workflow without losing read-only visibility for regular
members.
**Migration**: Workspace members without member-create permission continue to use the users page as a read-only member
directory, while admins and owners gain the add-member modal; role edits and member removal remain out of scope.

## ADDED Requirements

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
