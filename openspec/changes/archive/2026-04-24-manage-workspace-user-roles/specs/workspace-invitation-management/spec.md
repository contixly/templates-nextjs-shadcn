## MODIFIED Requirements

### Requirement: Workspace Invitations Can Be Created From A Modal
The system MUST let an authorized workspace member create a new workspace invitation from the invitations settings page
by entering the invited user's email address and selecting one built-in role already supported by the application
configuration.

#### Scenario: Authorized member sees role selection in the create-invitation modal
- **WHEN** a workspace member with `invitation:create` permission opens the create-invitation modal
- **THEN** the modal accepts the invited email address
- **AND** presents a role selector containing only the built-in roles that member is allowed to assign

#### Scenario: Authorized member creates invitation with the selected role
- **WHEN** a workspace member with `invitation:create` permission submits an email and an allowed built-in role in the
  create-invitation modal
- **THEN** the system creates a pending invitation for the current workspace with the selected role
- **AND** reveals a shareable invitation link in the same flow

#### Scenario: Invitation link can be copied immediately after creation
- **WHEN** a new invitation is created successfully
- **THEN** the modal shows the generated invitation link
- **AND** lets the user copy it without leaving the current page

#### Scenario: Duplicate, redundant, or disallowed invitation is rejected
- **WHEN** the submitted email already belongs to an existing workspace member or an actionable invitation for the same
  workspace
- **OR** the selected role is not supported or is not assignable by the acting member
- **THEN** the system rejects the create-invitation request
- **AND** surfaces a validation error without creating a duplicate invitation

#### Scenario: Unauthorized member cannot create invitation
- **WHEN** an authenticated workspace member without `invitation:create` permission opens the invitations settings page
- **THEN** the system rejects access to the invitations admin surface
- **AND** does not allow the create-invitation mutation to succeed
