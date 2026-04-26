## MODIFIED Requirements

### Requirement: Workspace Invitations Can Be Created From A Modal
The system MUST let an authorized workspace member create a new workspace invitation from the invitations settings page
by entering the invited user's email address and selecting one built-in role already supported by the application
configuration, only when the invited email domain is allowed by the workspace's active domain restrictions.

#### Scenario: Authorized member sees role selection in the create-invitation modal
- **WHEN** a workspace member with `invitation:create` permission opens the create-invitation modal
- **THEN** the modal accepts the invited email address
- **AND** presents a role selector containing only the built-in roles that member is allowed to assign
- **AND** communicates any active allowed-domain restrictions for the workspace

#### Scenario: Authorized member creates invitation with an allowed recipient domain
- **WHEN** a workspace member with `invitation:create` permission submits an email whose domain is allowed by the
  workspace's active domain restrictions
- **AND** selects an allowed built-in role in the create-invitation modal
- **THEN** the system creates a pending invitation for the current workspace with the selected role
- **AND** reveals a shareable invitation link in the same flow

#### Scenario: Authorized member creates invitation when restrictions are disabled
- **WHEN** a workspace member with `invitation:create` permission submits an email while the workspace has no active
  allowed-domain restrictions
- **AND** selects an allowed built-in role in the create-invitation modal
- **THEN** the system creates a pending invitation for the current workspace with the selected role
- **AND** reveals a shareable invitation link in the same flow

#### Scenario: Invitation link can be copied immediately after creation
- **WHEN** a new invitation is created successfully
- **THEN** the modal shows the generated invitation link
- **AND** lets the user copy it without leaving the current page

#### Scenario: Duplicate, redundant, domain-restricted, or disallowed invitation is rejected
- **WHEN** the submitted email already belongs to an existing workspace member or an actionable invitation for the same
  workspace
- **OR** the submitted email domain is not allowed by the workspace's active domain restrictions
- **OR** the selected role is not supported or is not assignable by the acting member
- **THEN** the system rejects the create-invitation request
- **AND** surfaces a validation error without creating a duplicate or domain-restricted invitation

#### Scenario: Concurrent duplicate invitation requests are rejected atomically
- **WHEN** two authorized requests attempt to create a pending invitation for the same workspace and recipient email at
  the same time
- **THEN** at most one pending invitation is stored
- **AND** the losing request receives a duplicate-invitation validation error

#### Scenario: Unauthorized member cannot create invitation
- **WHEN** an authenticated workspace member without `invitation:create` permission opens the invitations settings page
- **THEN** the system rejects access to the invitations admin surface
- **AND** does not allow the create-invitation mutation to succeed

### Requirement: Invitation Eligibility Uses Verified Primary Email
The system MUST allow invitation acceptance only when the invited email matches the authenticated user's verified
primary email and the invited email domain satisfies the workspace's active domain restrictions.

#### Scenario: Verified primary email matches invitation and domain restrictions
- **WHEN** the invitation email equals the authenticated user's verified primary email
- **AND** the workspace has no active allowed-domain restrictions or the email domain is allowed
- **THEN** the system allows invitation acceptance

#### Scenario: Primary email is not verified
- **WHEN** the invitation email equals the authenticated user's primary email but that email is not verified
- **THEN** the system does not allow the invitation to be accepted
- **AND** renders an explicit email-verification error state

#### Scenario: Primary email does not match invitation
- **WHEN** the invitation email does not match the authenticated user's primary email
- **THEN** the system does not allow the invitation to be accepted
- **AND** renders an explicit recipient-mismatch error state
- **AND** does not render workspace, recipient, inviter, role, or expiration details for that invitation

#### Scenario: Primary email domain is no longer allowed
- **WHEN** the invitation email equals the authenticated user's verified primary email
- **AND** the workspace has active allowed-domain restrictions that do not include the invitation email domain
- **THEN** the system does not allow the invitation to be accepted
- **AND** renders an explicit domain-restriction error state
- **AND** leaves workspace membership unchanged
