## MODIFIED Requirements

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

## ADDED Requirements

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
