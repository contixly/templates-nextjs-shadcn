## Why

The current account and workspace settings surfaces use the same shell, but their content is still built as generic
card stacks. The Vercel reference makes the target clearer: each settings page should first explain the page context,
then render bounded islands for the fields, tables, empty states, and actions that can change on that page.

## What Changes

- Add a shared settings-surface composition for account settings and organization-scoped workspace settings.
- Introduce a page-level contextual intro inside the settings content rail, separate from the global document header.
- Convert settings content from generic page cards into section islands with section-specific titles, descriptions,
  content, and actions.
- Preserve the existing left-side settings navigation and organization/account route structure.
- Keep all styling theme-token based so surfaces remain readable and contrasty in light and dark themes.
- Add focused tests for the shared shell/composition helpers and affected account/workspace settings pages.

## Capabilities

### New Capabilities

- `settings-surface-composition`: Shared Vercel-inspired settings page composition for account settings and
  organization-scoped workspace settings.

### Modified Capabilities

- `workspace-settings-navigation`: Workspace settings pages must follow the shared settings-surface composition when
  rendering the selected section page.

## Impact

- Affected code: `src/components/application/settings/settings-shell.tsx`, settings route pages under
  `src/app/(protected)/(global)/user/*` and
  `src/app/(protected)/(global)/[organizationKey]/settings/*`, account settings components, workspace settings
  components, translations, and settings tests.
- Affected systems: visual structure and accessibility of account settings and workspace settings only.
- APIs/data: no server action, repository, database, auth, or route contract changes are expected.
