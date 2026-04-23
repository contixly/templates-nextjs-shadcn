# workspace-organization-management Specification

## Purpose
TBD - created by archiving change replace-workspaces-with-organizations. Update Purpose after archive.
## Requirements
### Requirement: Workspace Management Uses Better Auth Organizations
The system MUST back workspace management with Better Auth organizations while preserving "Workspace" as the user-facing term.

#### Scenario: Workspace list is sourced from accessible organizations
- **WHEN** an authenticated user opens the workspace management page
- **THEN** the system loads the organizations the user can access
- **AND** renders them using workspace terminology in the UI

#### Scenario: Workspace details expose organization-backed fields
- **WHEN** the workspace management UI renders an item
- **THEN** the item includes the organization id as the workspace identifier
- **AND** displays the organization name as the workspace name
- **AND** exposes the workspace slug for management flows

### Requirement: Workspace Creation Generates a Deduplicated Slug
The system MUST create workspaces by creating Better Auth organizations from a user-provided name and a generated deduplicated slug.

#### Scenario: Creating a workspace from name only
- **WHEN** an authenticated user submits a workspace creation form with a name
- **THEN** the system generates a slug from that name
- **AND** creates an organization with that name and slug

#### Scenario: Slug generation deduplicates collisions
- **WHEN** a generated slug is already taken
- **THEN** the system generates another slug deterministically
- **AND** retries until it produces an unused slug

#### Scenario: Creating a workspace updates active context
- **WHEN** an authenticated user successfully creates a workspace
- **THEN** the system updates `session.activeOrganizationId` to that organization
- **AND** redirects the user to `/:organizationKey/dashboard` using the generated workspace slug when available

### Requirement: Workspace Settings Support Name, Slug, and Default Context

The system MUST let any accessible workspace member open the dedicated workspace settings page, while only members with
organization-update permission can change organization-backed workspace settings from that page.

#### Scenario: Regular member sees workspace settings in read-only mode
- **WHEN** an authenticated workspace member without organization-update permission opens the dedicated workspace
  settings page for an accessible workspace
- **THEN** the system loads the current workspace name, slug, and default-workspace state
- **AND** renders those values in a read-only presentation
- **AND** does not expose a working submit path for workspace-setting mutations

#### Scenario: Authorized workspace admin can update settings
- **WHEN** an authenticated workspace member with organization-update permission updates the name, slug, or
  default-workspace state from the dedicated workspace settings page
- **THEN** the system updates the underlying organization fields as requested

#### Scenario: Unauthorized direct update is rejected
- **WHEN** an authenticated workspace member without organization-update permission submits a workspace-settings update
  request directly
- **THEN** the system rejects the mutation
- **AND** leaves the underlying organization unchanged

### Requirement: Workspace Switching Is Explicit
The system MUST update active workspace context only through explicit user actions in workspace switching controls or settings.

#### Scenario: Sidebar switcher changes active workspace and navigates
- **WHEN** an authenticated user selects a workspace in the sidebar switcher
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to `/:organizationKey/dashboard` using the workspace slug when available

#### Scenario: Current workspace label follows URL context
- **WHEN** an authenticated user is viewing `/:organizationKey/...`
- **THEN** workspace switching controls label the current workspace using the accessible organization whose slug or ID matches that route key
- **AND** do not label a different workspace just because `session.activeOrganizationId` points elsewhere

### Requirement: Workspace Deletion Requires Organization Delete Permission

The system MUST expose workspace deletion only to members who have organization-delete permission for that workspace.

#### Scenario: Owner can access delete controls when other product rules allow deletion
- **WHEN** an authenticated workspace member with organization-delete permission opens workspace management or workspace
  settings for a workspace that satisfies the existing non-permission deletion rules
- **THEN** the system renders the delete action for that workspace

#### Scenario: Admin or regular member does not see delete controls
- **WHEN** an authenticated workspace member without organization-delete permission opens workspace management or
  workspace settings for an accessible workspace
- **THEN** the system does not render the delete action for that workspace

#### Scenario: Unauthorized direct delete is rejected
- **WHEN** an authenticated workspace member without organization-delete permission submits a delete-workspace request
  directly
- **THEN** the system rejects the mutation
- **AND** leaves the workspace unchanged

