## 1. Update the workspace route

- [ ] 1.1 Replace the wrapped `loadWorkspace()` call in `src/app/(protected)/(global)/[workspaceId]/page.tsx` with route-owned access validation and redirect control flow.
- [ ] 1.2 Render the existing forbidden experience for inaccessible workspaces instead of allowing the route to fall through to a blank page.

## 2. Move loading feedback to the route

- [ ] 2.1 Add `src/app/(protected)/(global)/[workspaceId]/loading.tsx` for the workspace route loading state.
- [ ] 2.2 Remove the page-level full-route Suspense fallback from `src/app/(protected)/(global)/[workspaceId]/page.tsx`.

## 3. Verify

- [ ] 3.1 Add or update tests that cover redirect, forbidden, and loading behavior for the workspace route.
- [ ] 3.2 Run the focused test command for the affected route behavior.
