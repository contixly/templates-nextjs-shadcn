## Why

Workspace management currently mixes two different patterns: user settings use dedicated pages with a left-side
navigation, while workspace settings still rely on a dialog opened from the workspace card. That makes
organization-level administration harder to extend now that Better Auth organization capabilities cover invitations,
members, teams, and roles and the product needs a stable settings information architecture for those surfaces.

## What Changes

- Add a dedicated workspace settings section rendered as separate organization-scoped pages with the same split layout
  pattern already used for user settings: vertical navigation on the left and page content on the right.
- Introduce the first workspace settings navigation structure with five sections: workspace settings, invitations,
  workspace users, workspace teams, and roles.
- Move the existing workspace configuration UI for renaming the workspace, editing the slug, and changing the default
  workspace from the current dialog into the new workspace settings page.
- Replace the current workspace settings dialog entry point with navigation to the new workspace settings route.
- Ship placeholder pages only for invitations, users, teams, and roles in this change; no management functionality, API
  integration, or Better Auth organization workflows beyond the existing workspace settings form are included.

## Capabilities

### New Capabilities

- `workspace-settings-navigation`: Organization-scoped workspaces expose a dedicated settings area with section
  navigation and individual pages for workspace settings, invitations, users, teams, and roles.

### Modified Capabilities

- `workspace-organization-management`: Workspace name, slug, and default selection management move from a dialog-based
  flow to the dedicated workspace settings page while preserving the existing edit behavior.

## Impact

- Affected code: organization-scoped routes under `src/app/(protected)/(global)/[organizationKey]`, workspace route
  definitions, workspace navigation components, the existing `WorkspaceSettingsDialog`, and translations/tests for
  workspace management UI.
- Affected systems: workspace information architecture, organization-scoped navigation, and the current workspace
  settings entry point from the workspaces list.
- Dependencies: no new runtime dependencies are expected; the new settings IA should align with Better Auth organization
  concepts for invitations, members, teams, and roles documented
  at [Better Auth Organization](https://better-auth.com/docs/plugins/organization).
