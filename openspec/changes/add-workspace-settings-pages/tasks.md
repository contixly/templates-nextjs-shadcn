## 1. Workspace Settings Routing

- [ ] 1.1 Extend workspace route definitions with an organization-scoped settings route family and section routes for
  workspace, invitations, users, teams, and roles.
- [ ] 1.2 Add the protected app route files and shared layout needed to render workspace settings pages with a left-side
  navigation shell.
- [ ] 1.3 Implement the workspace settings navigation component so the active section is derived from the current route
  and the root settings route redirects to the workspace section.

## 2. Workspace Settings Form Migration

- [ ] 2.1 Extract the existing workspace settings form UI from `WorkspaceSettingsDialog` into a reusable page-level
  component without changing the current validation or action contract.
- [ ] 2.2 Mount the extracted form on the dedicated workspace settings page and load the current accessible workspace
  values into it.
- [ ] 2.3 Replace the workspace card settings trigger so it navigates to the new workspace settings page instead of
  opening the old dialog.

## 3. Placeholder Sections

- [ ] 3.1 Create invitations, users, teams, and roles page stubs inside the workspace settings shell.
- [ ] 3.2 Add placeholder copy and translations that clearly mark those sections as present but not yet functional.
- [ ] 3.3 Ensure the placeholder sections do not render incomplete management controls or data-loading behavior.

## 4. Verification

- [ ] 4.1 Add or update tests for workspace settings route resolution, navigation state, and redirect behavior within
  the new settings subtree.
- [ ] 4.2 Add or update tests covering the moved workspace settings form and the workspace-card entry point that now
  routes to settings.
- [ ] 4.3 Run the relevant lint and test suites for workspace routing, workspace settings UI, and translations.
