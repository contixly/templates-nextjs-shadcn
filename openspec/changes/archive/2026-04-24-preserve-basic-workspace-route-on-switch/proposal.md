## Why

Workspace switching currently always sends the user to the selected workspace dashboard, even when the current page
exists in the selected workspace too. This breaks context for base workspace pages such as settings invitations, where
users expect only the workspace segment to change.

## What Changes

- Update workspace switching controls so selecting another workspace preserves the current base workspace route when
  that route is safely transferable.
- Treat base organization-scoped pages as routes whose only dynamic segment is `organizationKey`, for example
  `/:organizationKey/settings/invitations`.
- Keep the existing dashboard fallback when the current route has additional dynamic identifiers or otherwise does not
  match an allowed base workspace route.
- Preserve the existing active organization mutation, slug-preferred organization route keys, refresh behavior, and
  switch failure toast behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace-organization-management`: Workspace switching should preserve equivalent base workspace pages across
  workspaces and only fall back to the selected workspace dashboard for complex or unsupported routes.

## Impact

- Affects workspace switching navigation in `src/features/workspaces/components/ui/workspace-switcher.tsx` and
  `src/features/workspaces/components/ui/workspace-sidebar-switcher.tsx`.
- Likely adds or reuses a small route-resolution helper near workspace routing utilities so both switchers share the
  same preservation rules.
- Requires tests for base workspace route preservation and complex route dashboard fallback.
