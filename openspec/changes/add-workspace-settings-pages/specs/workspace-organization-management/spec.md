## MODIFIED Requirements

### Requirement: Workspace Settings Support Name, Slug, and Default Context

The system MUST allow users to manage organization-backed workspace settings on a dedicated workspace settings page,
including renaming, slug updates, and default workspace selection.

#### Scenario: Opening workspace settings from workspace management

- **WHEN** an authenticated user chooses to configure an accessible workspace from the workspace management UI
- **THEN** the system navigates the user to that workspace's dedicated workspace settings page

#### Scenario: Loading current workspace values on the settings page

- **WHEN** an authenticated user opens the dedicated workspace settings page for an accessible workspace
- **THEN** the system loads the current workspace name, slug, and default-workspace state into the form

#### Scenario: Renaming a workspace

- **WHEN** an authenticated user updates the name of an accessible workspace from the dedicated workspace settings page
- **THEN** the system updates the underlying organization name
- **AND** the workspace management UI reflects the new name

#### Scenario: Changing a workspace slug

- **WHEN** an authenticated user updates a workspace slug from the dedicated workspace settings page
- **AND** the slug is not already in use
- **THEN** the system updates the underlying organization slug
- **AND** subsequent generated workspace URLs use the updated slug

#### Scenario: Rejecting an unavailable slug

- **WHEN** an authenticated user updates a workspace slug from the dedicated workspace settings page to one that is
  already in use
- **THEN** the system rejects the change
- **AND** returns a validation error without changing the workspace

#### Scenario: Setting a default workspace

- **WHEN** an authenticated user marks an accessible workspace as default from the dedicated workspace settings page
- **THEN** the system persists `isDefault = true` on that organization
- **AND** clears the default flag from the user's other accessible organizations
