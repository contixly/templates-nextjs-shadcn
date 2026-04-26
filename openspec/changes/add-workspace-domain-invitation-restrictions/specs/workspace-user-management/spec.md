## ADDED Requirements

### Requirement: Workspace Users Settings Page Flags Members Outside Domain Restrictions
The system MUST mark workspace members whose email domains do not match the workspace's active allowed-domain
restrictions and MUST render a page-level warning when any current member is outside those restrictions.

#### Scenario: Restrictions are disabled
- **WHEN** an authenticated user opens the users settings page for an accessible workspace with no active allowed-domain
  restrictions
- **THEN** the system renders the users table without domain-restriction markers
- **AND** does not render a domain-restriction warning for existing members

#### Scenario: Existing members include out-of-policy users
- **WHEN** an authenticated user opens the users settings page for an accessible workspace with active allowed-domain
  restrictions
- **AND** one or more listed members have email domains outside those restrictions
- **THEN** the system renders a page-level warning that identifies the presence of out-of-policy members
- **AND** marks each out-of-policy member row in the users table
- **AND** leaves those memberships unchanged

#### Scenario: Existing members all match restrictions
- **WHEN** an authenticated user opens the users settings page for an accessible workspace with active allowed-domain
  restrictions
- **AND** every listed member email domain matches the restrictions
- **THEN** the system does not render a domain-restriction warning
- **AND** does not mark any member row as out-of-policy

## MODIFIED Requirements

### Requirement: Workspace Users Settings Page Supports Direct Member Addition
The system MUST allow an authorized workspace member to add an existing user to the workspace directly from the users
settings surface by providing a user ID and choosing one built-in role already supported by the application
configuration, while checking the target user's email domain against active workspace domain restrictions before
creating the membership.

#### Scenario: Authorized workspace admin sees add-member control
- **WHEN** an authenticated workspace member with `member:create` permission opens the users settings page
- **THEN** the system renders an add-member-by-user-ID control within the users management surface
- **AND** the control opens a modal that accepts a user ID and role selection

#### Scenario: Adding an existing user with an allowed domain succeeds
- **WHEN** an authorized workspace member submits the ID of an existing user who is not yet a member of the workspace
- **AND** the target user's email domain is allowed by the workspace's active domain restrictions or restrictions are
  disabled
- **AND** selects a built-in role they are allowed to assign
- **THEN** the system adds that user to the underlying organization with the selected role
- **AND** refreshes the users page so the new member appears in the member list with that role

#### Scenario: Direct add for a restricted domain returns a warning before membership creation
- **WHEN** an authorized workspace member submits the ID of an existing user who is not yet a member of the workspace
- **AND** the target user's email domain is outside the workspace's active domain restrictions
- **AND** the request has not acknowledged the domain-restriction warning
- **THEN** the system returns a warning state to the add-member modal
- **AND** does not create the membership

#### Scenario: Authorized workspace admin confirms direct add override
- **WHEN** an authorized workspace member resubmits a direct add-member request after acknowledging the
  domain-restriction warning
- **AND** the target user still exists and is not yet a member of the workspace
- **AND** the selected role is still assignable by the acting member
- **THEN** the system adds that user to the underlying organization with the selected role
- **AND** refreshes the users page so the new member appears with an out-of-policy marker

#### Scenario: Invalid, redundant, or disallowed add-member request is rejected
- **WHEN** an authorized workspace member submits a user ID that does not exist, already belongs to a current workspace
  member, or is paired with a role they are not allowed to assign
- **THEN** the system rejects the request
- **AND** surfaces a validation error without creating a duplicate membership

#### Scenario: Unauthorized workspace member cannot add users directly
- **WHEN** an authenticated workspace member without `member:create` permission opens the users settings page
- **THEN** the system still renders the current membership information in read-only mode
- **AND** does not render the add-member-by-user-ID control
- **AND** does not allow the direct add-member mutation to succeed
