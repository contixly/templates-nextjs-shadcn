## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Workspace Teams Support Active Team Session Context
**Reason**: Active team session selection is Better Auth default behavior, but it is not a workspace product feature for this template. Keeping application controls for it creates unnecessary session state and delete-flow edge cases.

**Migration**: Remove workspace UI, server actions, schemas, messages, and tests dedicated to setting or clearing active teams. Keep Better Auth Teams enabled and keep nullable `session.activeTeamId` in the database schema for compatibility.
