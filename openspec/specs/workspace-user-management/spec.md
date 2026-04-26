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
management actions to authorized direct-add and role-update workflows. Member removal MUST remain out of scope for this
release.

**Reason**: Workspace administrators now need role assignment and role updates, but regular members must still retain a
read-only directory view and member removal is still deferred.
**Migration**: Workspace members without `member:create` and `member:update` permission continue to use the users page
as a read-only member directory. Members with those permissions gain only the controls their permission set allows.

#### Scenario: Regular members keep read-only access
- **WHEN** an authenticated workspace member without `member:create` and `member:update` permission opens the users
  settings page
- **THEN** the system renders the existing membership information in read-only mode
- **AND** does not expose add-member or role-edit controls

#### Scenario: Authorized member sees only the controls they can use
- **WHEN** an authenticated workspace member with `member:create` or `member:update` permission opens the users
  settings page
- **THEN** the system keeps the full membership directory visible
- **AND** renders add-member controls only if the member has `member:create` permission
- **AND** renders role-update controls only for editable member rows if the member has `member:update` permission

#### Scenario: Member removal remains out of scope
- **WHEN** an authenticated user opens the users settings page after this change
- **THEN** the system does not render member-removal controls
- **AND** does not allow a member-removal workflow from this surface

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

### Requirement: Workspace Users Settings Page Supports Member Role Updates
The system MUST allow an authorized workspace member to update another workspace member's role directly from the users
table using the built-in roles already supported by the application configuration.

#### Scenario: Current user summary remains informational
- **WHEN** an authenticated user opens the users settings page
- **THEN** the system keeps the dedicated current-user summary as an informational view
- **AND** renders role-changing controls only within the other-users table

#### Scenario: Authorized workspace admin sees row-level role controls
- **WHEN** an authenticated workspace member with `member:update` permission opens the users settings page
- **THEN** the system renders a role-changing control inside the existing roles column for editable rows in the users
  table
- **AND** limits the selectable roles to the built-in roles that member is allowed to assign
- **AND** does not render a separate role-action column
- **AND** keeps non-editable, unsupported, or multi-role rows as read-only role labels in that same roles column

#### Scenario: Changing a member role succeeds
- **WHEN** an authorized workspace member selects a different allowed role for an editable member row
- **THEN** the system updates that workspace membership to the selected role
- **AND** refreshes the users page so the new role appears in the roles column

#### Scenario: Disallowed or redundant role change is rejected
- **WHEN** an authorized workspace member attempts to set a role they are not allowed to assign, modify a protected
  owner membership without owner privileges, or submit the member's current role again
- **THEN** the system rejects the request
- **AND** surfaces a validation error without changing the stored membership

#### Scenario: Unauthorized workspace member cannot update roles
- **WHEN** an authenticated workspace member without `member:update` permission opens the users settings page
- **THEN** the system does not render row-level role controls
- **AND** does not allow the member-role update mutation to succeed

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

