## Context

Account settings and workspace settings already share `SettingsPageShell`: a left-side settings navigation and a right
content rail. The content inside that rail is less consistent. Profile, security, connections, workspace details,
users, invitations, placeholders, and danger flows are each built around their own shadcn `Card` usage, often with the
card header doubling as the page context.

The target direction is closer to Vercel settings pages: the selected page first states what the page is for, then the
mutable or data-bearing content appears as bounded section islands. The screenshot reference also shows restrained
contrast, narrow readable content, stable table/list boundaries, and controls attached to the section they affect.

Next.js constraints remain unchanged: route `page.tsx` files stay thin, layouts remain shared where possible, and
interactive form/table controls stay in focused Client Components rather than promoting entire route trees to the
client bundle.

## Goals / Non-Goals

**Goals:**

- Establish a reusable settings-page composition for account settings and workspace settings.
- Add a page intro primitive that renders inside the settings content rail and explains the selected page.
- Add or adapt a section-island primitive for forms, tables, empty states, and destructive actions.
- Update account profile, account security/sessions, account connections, account danger, workspace settings,
  workspace users, workspace invitations, and workspace placeholder pages to use the shared composition.
- Keep surfaces readable and visually distinct in both light and dark themes using semantic tokens.
- Cover the shared composition and representative converted pages with focused tests.

**Non-Goals:**

- Changing authentication, authorization, server action behavior, repository caching, or database schema.
- Adding new account or workspace management capabilities beyond visual/composition changes.
- Replacing the application sidebar or the existing left settings navigation IA.
- Recreating Vercel pixel-for-pixel; the goal is the composition pattern, density, contrast, and hierarchy.

## Decisions

### 1. Treat the intro and islands as shared settings primitives

Decision:

- Extend `components/application/settings/settings-shell.tsx` with settings-specific composition helpers, likely:
  `SettingsPageHeader` for contextual page intro and `SettingsSection`/`SettingsSectionHeader`/`SettingsSectionContent`
  for bounded islands.
- Keep these primitives presentational and data-agnostic.

Rationale:

- The shell already owns the layout concept for settings pages.
- Keeping these helpers outside feature folders avoids duplicating the same Card/header/footer pattern across accounts
  and workspaces.
- Presentational primitives can remain Server Component-compatible unless they render interactive children.

Alternatives considered:

- Restyle global `Card`: rejected because cards are used outside settings and not every card should become a Vercel
  settings island.
- Build feature-specific account/workspace wrappers: rejected because it would preserve duplicated composition logic.

### 2. Move settings page context into the content rail

Decision:

- Settings route configs may keep `hidePageHeader: true`.
- Each settings page should render its own intro at the top of the selected `SettingsPageSection`, before any island.

Rationale:

- The global `DocumentHeader` spans the broader document area, while the Vercel-style context belongs to the settings
  content column.
- Keeping the intro in each page makes section-specific copy explicit and avoids coupling the settings shell to route
  translation lookup.

Alternatives considered:

- Re-enable the global `DocumentHeader`: rejected because it splits visual hierarchy from the settings rail.
- Have `SettingsPageShell` infer the current page title automatically: rejected for now because explicit page-level
  rendering is easier to test and lets pages supply richer context or action rows later.

### 3. Section islands replace monolithic page cards

Decision:

- Convert each current page-level card into one or more section islands.
- A section island owns its local title, description, content, and optional footer/action row.
- Existing form/list/table components keep their business behavior but receive layout changes around them.

Rationale:

- Vercel pages make each independent decision area easy to scan: billing method, credit, add-ons, invoice recipient,
  address, language, and tax are distinct islands.
- The app has similar boundaries: avatar, display name, email, user ID, sessions, connected providers, danger action,
  workspace identity, current member, member table, and invitations table.

Alternatives considered:

- Keep one card per page and only tweak spacing/colors: rejected because it does not solve repeated generic page
  headers or large mixed-content cards.
- Flatten all content without islands: rejected because settings pages need durable boundaries between independent
  actions.

### 4. Theme contrast uses existing semantic tokens

Decision:

- Use `bg-card`, `text-card-foreground`, `text-muted-foreground`, `border`, `ring-foreground/10`, `destructive`, and
  related semantic tokens rather than introducing page-specific hard-coded colors.
- Keep radius restrained and aligned with the repository's current zero-radius shadcn treatment unless the design system
  changes globally later.

Rationale:

- The project already has light/dark tokens in `globals.css`.
- The Vercel target depends more on hierarchy, boundaries, and density than a literal dark palette.

Alternatives considered:

- Introduce Vercel-specific color tokens: rejected because it would make settings pages drift from the rest of the app.

## Risks / Trade-offs

- [Shared primitive becomes too generic] -> Keep it scoped to `components/application/settings` and only support the
  settings composition needed now.
- [Translation churn] -> Reuse existing page titles/descriptions where suitable and add only section-specific labels
  required to avoid duplicated page copy.
- [Client bundle growth] -> Keep primitives server-compatible and avoid adding `"use client"` to shared wrappers.
- [Tables overflow on mobile] -> Preserve existing table semantics but wrap islands/content with overflow handling and
  stable width constraints.
- [Danger state loses emphasis in dark theme] -> Use semantic destructive tokens and verify contrast manually in both
  themes during implementation.

## Migration Plan

1. Add shared settings composition primitives and tests.
2. Convert account settings pages to render intro plus section islands while preserving existing server/client
   boundaries and mutations.
3. Convert workspace settings pages, users, invitations, and placeholders to the same composition.
4. Verify light and dark theme readability on representative account and workspace settings routes.

Rollback strategy:

- Revert the page/component composition changes and leave the existing settings shell and route structure unchanged.
  No data or API rollback is required.

## Open Questions

- Whether the danger account page should stay as its own route with one destructive island or later become a generic
  account settings section. This change keeps the existing route.
