## Why

The workspace route at `/workspaces/[workspaceId]` currently shows a loading spinner while the page resolves, but returns `null` when the requested workspace cannot be loaded. That creates a blank page for an invalid or unavailable workspace and leaves the fallback behavior undefined.

## What Changes

- Define explicit behavior when `/workspaces/[workspaceId]` cannot load the requested workspace.
- Move loading UI for the dynamic workspace route to the route-level loading convention used by the App Router.
- Remove the current blank-page outcome for missing workspaces.

## Capabilities

### New Capabilities
- `workspace-page-fallback`: Provides explicit loading and missing-workspace behavior for the workspace route.

### Modified Capabilities

## Impact

- `src/app/(protected)/(global)/[workspaceId]/page.tsx`: replace the undefined fallback path with explicit route behavior.
- `src/app/(protected)/(global)/[workspaceId]/loading.tsx`: add route-level loading UI if loading is moved out of the page component.
- `test/app/` or related route tests: add coverage for the selected fallback behavior.
