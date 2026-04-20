## Context

The `/workspaces/[workspaceId]` page currently delegates its access check to `loadWorkspace()`, a protected server action. That action calls `forbidden()` when the workspace is not available to the current user, but the shared action wrapper catches thrown errors and converts them into a generic failed `ActionResult`. In the page, that can collapse into `data === undefined`, which produces a blank screen.

The page also defines a manual full-route `<Suspense>` fallback even though the App Router already provides route-level loading behavior through `loading.tsx`.

## Goals / Non-Goals

**Goals:**
- Make the workspace route resolve to explicit outcomes instead of a blank page.
- Preserve authorization semantics for inaccessible workspaces.
- Use App Router route-level loading for this dynamic route.

**Non-Goals:**
- Refactor the shared action helper behavior across the codebase.
- Build a dashboard-specific skeleton or redesign the dashboard page.
- Change workspace routing beyond `/workspaces/[workspaceId]`.

## Decisions

### Decision 1: Validate workspace access directly in the page

The page should load the current user id and query the workspace repository directly instead of calling the wrapped `loadWorkspace()` action. This keeps route control flow in the page so `unauthorized()` and `forbidden()` can terminate rendering the way Next.js expects.

### Decision 2: Use the existing forbidden experience for missing access

If the workspace cannot be found for the current user, the route should call `forbidden()` and render the existing `src/app/forbidden.tsx` experience. This matches the intent already present in the workspace action and avoids introducing a second interpretation for the same authorization boundary.

### Decision 3: Move loading UI to `loading.tsx`

The route should expose loading feedback through `src/app/(protected)/(global)/[workspaceId]/loading.tsx` instead of wrapping the whole page in a manual `<Suspense>` boundary. This aligns the route with the App Router loading convention and keeps the page component focused on redirect control flow.
