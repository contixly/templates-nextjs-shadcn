## ADDED Requirements

### Requirement: Workspace UI Does Not Expose Default Workspace State
The system MUST NOT expose default workspace state in workspace management, workspace settings, or workspace switching UI.

#### Scenario: Workspace list renders without default markers
- **WHEN** an authenticated user opens a workspace list or workspace switching control
- **THEN** the system renders accessible workspaces without default badges, default star indicators, or default-specific labels

#### Scenario: Workspace settings render without default controls
- **WHEN** an authenticated user opens workspace settings for an accessible workspace
- **THEN** the system does not render a "set as default workspace" control
- **AND** does not submit default workspace state in workspace settings mutations

### Requirement: Workspace Settings Support Name and Slug
The system MUST let any accessible workspace member open the dedicated workspace settings page, while only members with organization-update permission can change organization-backed workspace name and slug settings from that page.

#### Scenario: Regular member sees workspace settings in read-only mode
- **WHEN** an authenticated workspace member without organization-update permission opens the dedicated workspace settings page for an accessible workspace
- **THEN** the system loads the current workspace name and slug
- **AND** renders those values in a read-only presentation
- **AND** does not expose a working submit path for workspace-setting mutations

#### Scenario: Authorized workspace admin can update settings
- **WHEN** an authenticated workspace member with organization-update permission updates the name or slug from the dedicated workspace settings page
- **THEN** the system updates the underlying organization fields as requested

#### Scenario: Unauthorized direct update is rejected
- **WHEN** an authenticated workspace member without organization-update permission submits a workspace-settings update request directly
- **THEN** the system rejects the mutation
- **AND** leaves the underlying organization unchanged

## MODIFIED Requirements

### Requirement: Workspace Creation Generates a Deduplicated Slug
The system MUST create workspaces by creating Better Auth organizations from a user-provided name and a generated deduplicated slug.

#### Scenario: Creating a workspace from name only
- **WHEN** an authenticated user submits a workspace creation form with a name
- **THEN** the system generates a slug from that name
- **AND** creates an organization with that name and slug
- **AND** does not accept or persist default workspace state for the organization

#### Scenario: Slug generation deduplicates collisions
- **WHEN** a generated slug is already taken
- **THEN** the system generates another slug deterministically
- **AND** retries until it produces an unused slug

#### Scenario: Creating a workspace updates active context
- **WHEN** an authenticated user successfully creates a workspace
- **THEN** the system updates `session.activeOrganizationId` to that organization
- **AND** redirects the user to `/:organizationKey/dashboard` using the generated workspace slug when available

### Requirement: Workspace Deletion Requires Organization Delete Permission
The system MUST expose workspace deletion only to members who have organization-delete permission for that workspace and only when deleting it would leave the user with at least one accessible workspace.

#### Scenario: Owner can access delete controls when another workspace remains
- **WHEN** an authenticated workspace member with organization-delete permission opens workspace management or workspace settings for a workspace
- **AND** the user has more than one accessible workspace
- **THEN** the system renders the delete action for that workspace

#### Scenario: Last accessible workspace cannot be deleted
- **WHEN** an authenticated workspace member with organization-delete permission opens workspace management or workspace settings for their only accessible workspace
- **THEN** the system does not render a working delete action for that workspace

#### Scenario: Unauthorized direct delete is rejected
- **WHEN** an authenticated workspace member without organization-delete permission submits a delete-workspace request directly
- **THEN** the system rejects the mutation
- **AND** leaves the workspace unchanged

#### Scenario: Direct delete is rejected when it would remove the last accessible workspace
- **WHEN** an authenticated workspace member with organization-delete permission submits a delete-workspace request directly for their only accessible workspace
- **THEN** the system rejects the mutation
- **AND** leaves the workspace unchanged

## REMOVED Requirements

### Requirement: Workspace Settings Support Name, Slug, and Default Context
**Reason**: Default workspace state was stored on the shared organization record, so one member's default preference could affect other members of the same workspace.

**Migration**: Replace this requirement with `Workspace Settings Support Name and Slug`. Existing settings flows must keep name and slug management while removing default controls and default state mutations.
