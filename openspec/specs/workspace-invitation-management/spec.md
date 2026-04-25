# workspace-invitation-management Specification

## Purpose
TBD - created by archiving change add-workspace-invitations. Update Purpose after archive.
## Requirements
### Requirement: Workspace Invitations Settings Page Lists Workspace Invitations
The system MUST render the workspace invitations settings section from the Better Auth organization invitations
associated with the current workspace only for members who have invitation-create permission for that workspace.

#### Scenario: Authorized workspace admin renders invitations table
- **WHEN** an authenticated workspace member with invitation-create permission opens the invitations settings page for a
  workspace they can access
- **THEN** the system loads invitations for the underlying organization
- **AND** renders them in a table with recipient email, role, inviter, created-at, expires-at, and status information

#### Scenario: Invitation statuses are derived consistently
- **WHEN** an authorized workspace member views an invitations list that contains pending, accepted, rejected,
  canceled, or expired invitations
- **THEN** the system renders a status value for each invitation row
- **AND** treats pending invitations past their expiration time as expired in the UI even if the stored status remains
  pending

#### Scenario: Invitation links can be copied from the table
- **WHEN** an authorized workspace member views an invitation row
- **THEN** the system exposes a copy-invitation-link action for that invitation
- **AND** the copied URL resolves to the application's invitation decision route
- **AND** the URL is built from the configured public application base URL rather than a placeholder domain

#### Scenario: Regular members cannot access the workspace invitations admin surface
- **WHEN** an authenticated workspace member without invitation-create permission opens the invitations settings page
- **THEN** the system rejects access to that route
- **AND** does not render the invitation table or copy-link actions

#### Scenario: No invitations exist for the workspace
- **WHEN** the invitations settings page loads for an accessible workspace and no invitations are returned for an
  authorized workspace member
- **THEN** the system renders an explicit empty state
- **AND** does not render the generic placeholder copy used before this change

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

#### Scenario: Concurrent duplicate invitation requests are rejected atomically
- **WHEN** two authorized requests attempt to create a pending invitation for the same workspace and recipient email at
  the same time
- **THEN** at most one pending invitation is stored
- **AND** the losing request receives a duplicate-invitation validation error

#### Scenario: Unauthorized member cannot create invitation
- **WHEN** an authenticated workspace member without `invitation:create` permission opens the invitations settings page
- **THEN** the system rejects access to the invitations admin surface
- **AND** does not allow the create-invitation mutation to succeed

### Requirement: Invitation Links Resolve To An Authenticated Decision Surface
The system MUST provide a dedicated invitation route that lets the invited user review and accept or reject the
invitation after authentication.

#### Scenario: Anonymous visitor returns to the invitation route after login
- **WHEN** an unauthenticated visitor opens an invitation link
- **THEN** the system redirects the visitor to authentication
- **AND** returns the visitor to the same invitation route after login completes

#### Scenario: Authenticated user can review invitation details
- **WHEN** an authenticated user opens a valid invitation route
- **THEN** the system renders invitation details including workspace name, invited email, role, inviter identity, and
  expiration
- **AND** offers accept and reject actions while the invitation remains actionable

#### Scenario: Accepting invitation grants workspace membership
- **WHEN** an eligible authenticated user accepts an actionable invitation
- **THEN** the system marks the invitation as accepted
- **AND** adds the user to the underlying organization membership with the invited role
- **AND** updates the active workspace context to that organization

#### Scenario: Rejecting invitation records the user's decision
- **WHEN** an eligible authenticated user rejects an actionable invitation
- **THEN** the system marks the invitation as rejected
- **AND** leaves workspace membership unchanged

### Requirement: Invitation Eligibility Uses Verified Primary Email
The system MUST allow invitation acceptance only when the invited email matches the authenticated user's verified
primary email.

#### Scenario: Verified primary email matches invitation
- **WHEN** the invitation email equals the authenticated user's verified primary email
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

### Requirement: Users Can Review Their Own Pending Invitations
The system MUST provide a current-user invitation list for pending invitations addressed to the authenticated user's
primary account email.

#### Scenario: Personal invitations page lists pending invitations
- **WHEN** an authenticated user opens their invitations page and has pending invitations for their primary account
  email
- **THEN** the system renders a list of those invitations with workspace name, invited email, role, expiration, and an
  entry point to accept or reject each invitation

#### Scenario: Personal invitations page renders an empty state
- **WHEN** an authenticated user opens their invitations page and no pending invitations exist for their primary
  account email
- **THEN** the system renders an explicit empty state

#### Scenario: Welcome page reuses the invitations block
- **WHEN** an authenticated user opens the welcome page and has pending invitations
- **THEN** the page renders the same invitations block used on the personal invitations page
- **AND** each invitation item links to the dedicated invitation decision route

#### Scenario: Welcome page omits the invitations block when there is nothing to act on
- **WHEN** an authenticated user opens the welcome page and has no pending invitations
- **THEN** the page does not render the invitations block

