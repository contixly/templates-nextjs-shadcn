# workspace-team-management Specification

## Purpose
TBD - created by archiving change add-better-auth-teams. Update Purpose after archive.
## Requirements
### Requirement: Workspace Teams Use Better Auth Teams
The system MUST back workspace team management with Better Auth Teams within the current workspace organization and
MUST preserve "workspace" as the user-facing organization term.

#### Scenario: Teams belong to the current workspace organization
- **WHEN** an authenticated user manages teams for an accessible workspace
- **THEN** the system stores and loads teams for the underlying Better Auth organization
- **AND** does not create teams outside that organization context

#### Scenario: Team support is available through auth configuration
- **WHEN** the application starts with Better Auth organization support enabled
- **THEN** the system enables Better Auth Teams on both the server auth plugin and client auth plugin
- **AND** keeps Better Auth's nullable active team session schema available for compatibility
- **AND** does not make active team selection part of workspace product behavior

#### Scenario: Team tables are persisted in Prisma
- **WHEN** the database schema is migrated for workspace teams
- **THEN** the system provides persistent team records with name, organization ID, created-at, and updated-at fields
- **AND** provides persistent team membership records with team ID, user ID, and created-at fields
- **AND** prevents duplicate membership rows for the same team and user

#### Scenario: New workspace does not create a default team
- **WHEN** an authenticated user creates a new workspace
- **THEN** the system creates the underlying Better Auth organization without creating an explicit team
- **AND** treats the workspace organization itself as the implicit all-members collaboration context

#### Scenario: Explicit team names are unique per workspace
- **WHEN** an authorized workspace member creates or renames a team
- **THEN** the system requires the normalized team name to be unique within that workspace organization
- **AND** allows the same normalized team name to exist in a different workspace organization

### Requirement: Workspace Teams Settings Page Lists Teams
The system MUST replace the Teams settings placeholder with a real teams settings page for each accessible workspace.

#### Scenario: Accessible member opens teams settings
- **WHEN** an authenticated user opens the teams settings page for a workspace they can access
- **THEN** the system loads teams for the underlying organization
- **AND** renders each team with its name and member count
- **AND** renders the page inside the shared workspace settings shell

#### Scenario: Workspace has no teams
- **WHEN** an authenticated user opens the teams settings page for an accessible workspace with no teams
- **THEN** the system renders an explicit empty state for teams
- **AND** does not render the generic placeholder content used before team management existed

#### Scenario: Inaccessible workspace teams page is rejected
- **WHEN** an authenticated user opens the teams settings page for a workspace they cannot access
- **THEN** the system rejects access
- **AND** does not load or render team data for that workspace

### Requirement: Authorized Members Can Manage Workspace Teams
The system MUST allow only authorized workspace members to create, rename, and delete teams.

#### Scenario: Authorized member sees team management controls
- **WHEN** an authenticated workspace member with `team:create`, `team:update`, or `team:delete` permission opens the
  teams settings page
- **THEN** the system renders only the team management controls allowed by that member's permissions

#### Scenario: Regular member sees teams read-only
- **WHEN** an authenticated workspace member without team management permissions opens the teams settings page
- **THEN** the system renders team information in read-only mode
- **AND** does not expose create, rename, or delete controls

#### Scenario: Creating a team succeeds
- **WHEN** a workspace member with `team:create` permission submits a valid team name for an accessible workspace
- **THEN** the system creates a Better Auth team in that workspace organization
- **AND** refreshes the teams settings page so the new team appears

#### Scenario: Creating a duplicate team name is rejected
- **WHEN** a workspace member with `team:create` permission submits a team name already used by another team in the same
  workspace after name normalization
- **THEN** the system rejects the request
- **AND** does not create a duplicate team

#### Scenario: Renaming a team succeeds
- **WHEN** a workspace member with `team:update` permission submits a valid new name for an existing team in the current
  workspace
- **THEN** the system updates that team's name
- **AND** refreshes the teams settings page so the new name appears
- **AND** refreshes invitation views that display the renamed team's name

#### Scenario: Renaming a team to a duplicate name is rejected
- **WHEN** a workspace member with `team:update` permission submits a name already used by another team in the same
  workspace after name normalization
- **THEN** the system rejects the request
- **AND** leaves the team name unchanged

#### Scenario: Deleting a team succeeds
- **WHEN** a workspace member with `team:delete` permission deletes an existing team in the current workspace
- **THEN** the system removes that team and its team memberships
- **AND** does not require the user to select, clear, or replace an active team
- **AND** refreshes invitation views that display the deleted team's name
- **AND** refreshes the teams settings page so the removed team no longer appears

#### Scenario: Deleting the last explicit team succeeds
- **WHEN** a workspace member with `team:delete` permission deletes the only explicit team in the current workspace
- **THEN** the system removes that team
- **AND** leaves the workspace organization available as the implicit all-members context
- **AND** renders the teams page empty state

#### Scenario: Unauthorized team mutation is rejected
- **WHEN** an authenticated workspace member without the required team permission submits a team create, rename, or
  delete request directly
- **THEN** the system rejects the mutation
- **AND** leaves the team records unchanged

### Requirement: Workspace Teams Manage Existing Workspace Members
The system MUST allow authorized workspace members to add existing workspace members to teams and remove users from
teams without changing workspace organization membership or organization roles.

#### Scenario: Team member list renders workspace member identities
- **WHEN** an authenticated user opens a team membership view for a team in an accessible workspace
- **THEN** the system renders the team's members with their workspace member identity information
- **AND** does not render users who belong to another workspace organization as team members

#### Scenario: Adding an existing workspace member to a team succeeds
- **WHEN** an authorized workspace member submits a user who already belongs to the current workspace organization
- **AND** the selected team belongs to that same workspace organization
- **THEN** the system adds the user to the selected team
- **AND** refreshes the team member list so the user appears
- **AND** leaves the user's organization role unchanged

#### Scenario: Removing a team member succeeds
- **WHEN** an authorized workspace member removes a user from a team in the current workspace
- **THEN** the system removes only that team membership
- **AND** leaves the user's workspace organization membership and role unchanged

#### Scenario: Cross-workspace team membership is rejected
- **WHEN** an authorized workspace member attempts to add a user who is not a member of the team parent organization
- **OR** attempts to add a workspace member to a team from another organization
- **THEN** the system rejects the request
- **AND** does not create a team membership

#### Scenario: Duplicate team membership is rejected
- **WHEN** an authorized workspace member attempts to add a user who is already a member of the selected team
- **THEN** the system rejects the duplicate request or returns the existing membership without creating another row

### Requirement: Workspace Teams Do Not Expose Active Team Controls
The system MUST NOT expose workspace application controls whose purpose is to set, clear, or switch a user's active team.

#### Scenario: Teams settings renders without active team controls
- **WHEN** an authenticated user opens the teams settings page for an accessible workspace
- **THEN** the system renders team management and membership controls according to permissions
- **AND** does not render active team badges
- **AND** does not render set-active-team or clear-active-team controls

#### Scenario: Workspace actions do not expose active team mutation
- **WHEN** an authenticated user interacts with workspace team management surfaces
- **THEN** the system provides actions for team creation, rename, deletion, member addition, and member removal
- **AND** does not provide a workspace action to set, clear, or switch active team session state
