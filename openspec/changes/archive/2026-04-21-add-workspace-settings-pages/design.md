## Context

The application already has a stable settings pattern for user administration: `/user/*` routes render a two-column
layout with a left-side navigation and a content area on the right. Workspace administration does not follow that
pattern yet. The current workspaces list opens `WorkspaceSettingsDialog` from each workspace card, which is sufficient
for editing name, slug, and default state, but it does not provide a scalable home for future organization capabilities
such as invitations, members, teams, and roles.

The requested change is intentionally partial. It needs to establish the workspace settings information architecture
now, move the existing workspace settings form into that area, and leave the other sections as placeholders for
follow-up changes. Better Auth organization documentation already groups these concepts under organization management,
so the application needs a route and layout structure that can absorb those flows without another navigation redesign
later.

## Goals / Non-Goals

**Goals:**

- Introduce an organization-scoped workspace settings shell that mirrors the existing user settings UX pattern.
- Define one page per requested section: workspace settings, invitations, users, teams, and roles.
- Move the existing workspace configuration form from the modal into the new workspace settings page without changing
  the underlying mutation semantics.
- Replace modal-based navigation from the workspaces list with route-based navigation into the new settings area.
- Keep the first implementation intentionally thin for every section except workspace settings.

**Non-Goals:**

- Implement invitations, membership management, team management, or role management.
- Add Better Auth organization client/server integration for the placeholder sections.
- Change the existing workspace update action contract, cache invalidation rules, or authorization model beyond what is
  needed to render the form on a page.
- Redesign the workspaces overview page beyond swapping the settings entry point from dialog to page navigation.

## Decisions

### 1. Add a dedicated organization-scoped settings route family

Decision:

- Introduce a route family rooted at `/:organizationKey/settings`.
- Use the same shell pattern as `/user/*`: left vertical menu, right content panel.
- Make the root settings route redirect to the first section rather than rendering a duplicate page.

Proposed section routes:

- `/:organizationKey/settings/workspace`
- `/:organizationKey/settings/invitations`
- `/:organizationKey/settings/users`
- `/:organizationKey/settings/teams`
- `/:organizationKey/settings/roles`

Rationale:

- This matches the established settings interaction model in the app.
- It gives every future organization-management area a stable permalink.
- Redirecting the root route avoids two URLs for the same primary settings content.

Alternatives considered:

- Keep modal-based workspace settings and add separate pages only for future sections: rejected because it preserves an
  inconsistent admin UX and splits related management entry points.
- Render every section in a single tabs page: rejected because the user explicitly requested separate pages and the app
  already favors sidebar navigation for settings.

### 2. Keep workspace terminology in UI, map future behavior to Better Auth organization concepts

Decision:

- Continue using "workspace" terminology in navigation labels and page copy.
- Treat invitations, users, teams, and roles as workspace settings sections, even though future implementation will map
  them to Better Auth organization invitations, members, teams, and roles.

Rationale:

- The product already presents organizations as workspaces.
- This keeps user-facing language consistent while preserving a clean path to Better Auth organization APIs later.

Alternatives considered:

- Rename the UI to "organization settings": rejected because it conflicts with the existing workspace vocabulary already
  used across the app.
- Expose a "members" section instead of "users": rejected for now because the request explicitly asks for workspace
  users; Better Auth membership terminology can stay internal until functional work begins.

### 3. Extract the settings form into a reusable page-level workspace settings surface

Decision:

- Reuse the current validation schema, server action, and success/error behavior from the modal flow.
- Move the actual editable fields into a reusable form/panel component that can render in a full page.
- Retire the dialog as the primary editing surface in favor of navigation to the workspace settings page.

Rationale:

- The mutation semantics are already defined and tested.
- Extracting the form body avoids duplicating validation and mutation wiring.
- Page-level rendering supports future expansion such as descriptions, audit hints, or related workspace actions.

Alternatives considered:

- Keep the dialog implementation and embed it inside the page: rejected because it would keep modal state and layout
  concerns inside a route-based flow for no benefit.
- Rewrite workspace settings from scratch as a new form: rejected because it increases regression risk without improving
  the requested outcome.

### 4. Placeholder sections stay intentionally non-interactive in this change

Decision:

- Invitations, users, teams, and roles pages will render section headers, short explanatory copy, and a clear
  placeholder/coming-soon state only.
- No loaders, mutations, tables, or Better Auth data fetching will be added for these pages in this change.

Rationale:

- The request explicitly scopes those sections to stubs.
- This lets the routing, layout, and translation structure land now without pre-committing incomplete domain behavior.

Alternatives considered:

- Add partial read-only lists for some sections: rejected because it widens the change and introduces uneven
  functionality across pages.
- Hide the future sections until functional implementation exists: rejected because the user explicitly wants the full
  settings IA visible now.

### 5. The workspaces list will navigate to settings instead of opening an edit dialog

Decision:

- Replace the workspace card settings action with a link/button that opens the workspace settings page for that specific
  organization.
- Keep destructive or secondary actions, such as delete, separate from the new settings navigation.

Rationale:

- The workspaces list remains the discovery point for accessible workspaces.
- Navigating to settings gives users a predictable path back to the same administrative shell later.

Alternatives considered:

- Leave both a dialog and a page entry point: rejected because it creates duplicate edit surfaces and unclear ownership
  of future settings behavior.

## Risks / Trade-offs

- [Route sprawl under organization pages] → Keep all settings pages under a single `settings` subtree and reuse one
  shared layout/navigation component.
- [Regression while moving the existing form out of the dialog] → Reuse the current action, schema, and success/error
  states rather than reimplementing business logic.
- [Users may expect the placeholder sections to be functional] → Make the placeholder state explicit in page copy and
  keep navigation labels stable so later changes can fill the same routes.
- [Workspace overview actions become less "inline"] → Accept one extra click in exchange for a scalable settings model
  that matches the existing user-settings UX.

## Migration Plan

1. Add workspace settings route definitions and a shared navigation component/layout for organization-scoped settings
   pages.
2. Extract the current workspace settings form content from `WorkspaceSettingsDialog` into a page-renderable component
   and mount it at the workspace settings route.
3. Add placeholder pages for invitations, users, teams, and roles inside the same settings shell.
4. Replace workspace-card settings triggers with links to the new route and remove the obsolete dialog entry point.
5. Update translations and tests for routing, navigation state, and the moved workspace settings form.

Rollback strategy:

- Reintroduce the dialog trigger on workspace cards and remove the new settings route subtree. Because the underlying
  workspace update action and data model remain unchanged, rollback is limited to UI routing/layout code.

## Open Questions

- Whether the workspace settings page should also host secondary destructive actions later, or whether those should
  remain on the workspace list or move to a dedicated danger section.
- Whether the section route segment for workspace members should remain `users` permanently or switch to `members` when
  Better Auth-backed functionality is implemented.
