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
- **AND** redirects the user to `/:organizationId/dashboard`

### Requirement: Workspace Settings Support Name, Slug, and Default Context
The system MUST allow users to manage organization-backed workspace settings, including renaming, slug updates, and default workspace selection.

#### Scenario: Renaming a workspace
- **WHEN** an authenticated user updates the name of an accessible workspace
- **THEN** the system updates the underlying organization name
- **AND** the workspace management UI reflects the new name

#### Scenario: Changing a workspace slug
- **WHEN** an authenticated user updates the slug of an accessible workspace
- **AND** the slug is not already in use
- **THEN** the system updates the underlying organization slug

#### Scenario: Rejecting an unavailable slug
- **WHEN** an authenticated user updates a workspace slug to one that is already in use
- **THEN** the system rejects the change
- **AND** returns a validation error without changing the workspace

#### Scenario: Setting a default workspace
- **WHEN** an authenticated user marks an accessible workspace as default
- **THEN** the system persists `isDefault = true` on that organization
- **AND** clears the default flag from the user's other accessible organizations

### Requirement: Workspace Switching Is Explicit
The system MUST update active workspace context only through explicit user actions in workspace switching controls or settings.

#### Scenario: Sidebar switcher changes active workspace and navigates
- **WHEN** an authenticated user selects a workspace in the sidebar switcher
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to `/:organizationId/dashboard`

#### Scenario: Current workspace label follows URL context
- **WHEN** an authenticated user is viewing `/:organizationId/...`
- **THEN** workspace switching controls label the current workspace using that `organizationId`
- **AND** do not label a different workspace just because `session.activeOrganizationId` points elsewhere

