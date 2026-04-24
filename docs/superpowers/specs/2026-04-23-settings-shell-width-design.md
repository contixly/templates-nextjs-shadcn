# Settings Shell Width Design

Date: 2026-04-23
Status: Approved for planning

## Context

The current settings-like pages in the protected area use a narrow page shell:

```tsx
<main className="max-w-2xl min-w-0 flex-1 space-y-6 px-2 md:mt-4 md:px-0">
```

That constraint is too small for the kinds of content these pages now contain:

- invitation tables
- membership tables
- billing-like sections
- long identifiers, emails, badges, and action cells

The result is not a single broken table. The page shell itself is too narrow for settings pages that mix forms and data-heavy sections. The invitation decision page has the same problem in a different form because it uses its own local `max-w-2xl` card.

The target direction is closer to the Vercel settings layout: a wider content rail with consistent outer spacing, enough room for data-heavy sections, and readable form sections that still feel focused.

## Goals

- Replace the narrow `max-w-2xl` settings shell with a wider shared rail for settings-like protected pages.
- Keep the overall composition centered and controlled rather than full-bleed.
- Support both data-heavy sections and simple forms within the same page system.
- Bring `/invite/[invitationId]` into the same layout language so spacing and width feel consistent.
- Preserve the same geometry for light and dark themes.

## Non-Goals

- Redesign all global `Card` or `Table` primitives across the entire app.
- Redesign public pages, onboarding hero sections, or non-settings product areas.
- Turn the settings area into a fully edge-to-edge layout.
- Solve every possible wide-content problem through the shell alone; horizontal overflow can still exist as a fallback inside genuinely large data widgets.

## Decision Summary

Adopt a new shared settings content rail for settings-like pages.

- The outer page shell becomes wider, using a centered `max-w-6xl` rail inside the protected content area.
- Content inside that rail uses one of two explicit modes:
  - `wide` for tables, lists, history, activity, and other data-heavy sections
  - `readable` for forms and decision-oriented screens
- `readable` sections use a left-aligned inner column with `max-w-3xl`.
- `/invite/[invitationId]` uses the same wide outer rail, but its page content remains `readable`.

This approach fixes the underlying page-width issue without forcing every section to become equally wide.

## Design

### 1. Shared Settings Shell

Create a shared settings content shell that replaces the current narrow `<main>` used by:

- `src/app/(protected)/(global)/user/layout.tsx`
- `src/app/(protected)/(global)/[organizationKey]/settings/layout.tsx`

The shell is responsible for:

- page width
- outer horizontal padding
- top spacing rhythm
- vertical spacing between sections

Recommended geometry:

- outer rail: `w-full max-w-6xl`
- horizontal padding: `px-2 md:px-4 xl:px-6`
- top spacing: preserve the current settings rhythm with `md:mt-4`
- vertical spacing between sections: preserve the existing `space-y-6` cadence
- content alignment: centered within the available area, not edge-to-edge

The shell should keep `min-w-0` so nested tables and inputs can shrink correctly. Width ownership moves to the shell, not to each page.

### 2. Section Width Modes

Within the shared shell, sections use one of two layout modes.

#### `wide`

Use for:

- invitations tables
- members tables
- billing-style matrices
- activity/history sections
- any block where multiple columns are part of the primary interaction

Rules:

- the section fills the width of the new `max-w-6xl` rail
- the card or section wrapper must not add its own narrower `max-w-*`
- table overflow is treated as a fallback, not the primary layout strategy

#### `readable`

Use for:

- profile forms
- security/settings forms
- single-purpose settings sections
- invite decision content

Rules:

- the section lives inside the wide shell
- the inner readable column is left-aligned, not centered
- the readable column uses `max-w-3xl`
- buttons, helper text, and form rows align to that readable column

This creates a stable page rhythm: wide data blocks can breathe, while ordinary forms remain readable.

### 3. Invite Page Alignment

`/invite/[invitationId]` should stop behaving like a standalone narrow card floating in a large empty field.

Instead:

- the route should adopt the same outer settings rail
- the page content itself should be treated as a `readable` section
- the current local `max-w-2xl` card constraint should be removed from the page-level layout logic

This keeps the invite page visually consistent with the rest of the settings-like protected experience while preserving a focused decision flow.

### 4. Theming

No special light-theme or dark-theme geometry is needed.

The shell design is theme-neutral:

- spacing stays identical across themes
- width rules stay identical across themes
- only color tokens, borders, backgrounds, and contrast come from the existing theme system

This avoids inventing separate layout behavior for light and dark mode.

### 5. Scope of Migration

The change applies to settings-like pages that currently depend on the narrow shell pattern.

In scope:

- the shared shell used by user settings pages
- the shared shell used by workspace settings pages
- the invitation decision page
- removal of conflicting local `max-w-2xl`/`mx-auto` constraints on pages that should now inherit the shell

Out of scope:

- public pages
- welcome/onboarding hero composition
- global redesign of all content primitives

### 6. Suggested Component Boundaries

To keep the system understandable and reusable, split responsibilities clearly:

- `SettingsContentShell`
  - owns outer rail width and page padding
- `SettingsSection`
  - owns section spacing and variant choice
- `SettingsSectionContent`
  - supports `wide` or `readable` inner layout

The layouts can use these primitives directly, or apply the same structure without introducing new abstraction names immediately. The important part is the separation of responsibilities:

- shell decides page width
- section decides content mode
- pages no longer hardcode arbitrary width limits

## Error Handling and Regression Risks

### Risk: simple forms feel too stretched

Mitigation:

- forms use `readable` mode with `max-w-3xl`

### Risk: wide sections still overflow at medium breakpoints

Mitigation:

- verify `md` and laptop widths explicitly
- keep `min-w-0` on the main content chain
- allow local overflow fallback only where the content is genuinely too wide

### Risk: conflicting local width constraints remain in pages

Mitigation:

- audit settings-like pages for local `max-w-*`, `mx-auto`, and similar width ownership after the shell change

### Risk: invite page loses focus after widening

Mitigation:

- keep invite content in `readable` mode inside the wider rail

## Testing

### Pages to verify

- `user/profile`
- `user/security`
- `user/connections`
- `user/invitations`
- `[organizationKey]/settings/users`
- `[organizationKey]/settings/invitations`
- other pages rendered through the same user/workspace settings layouts
- `/invite/[invitationId]`

### Viewports

- mobile
- medium-width laptop
- desktop
- wide desktop

### Themes

- light
- dark

### Data cases

- long emails
- long user IDs
- multiple role badges
- wide action cells
- table rows with several visible columns

## Implementation Notes for Planning

The implementation plan should explicitly include:

1. updating the two settings layout shells
2. migrating the invite decision page to the same outer rail
3. defining the `wide` and `readable` section rules
4. removing local width constraints that now conflict with the shell
5. verifying layout behavior across the page set listed above

## Final Decision

Adopt a Vercel-like settings shell with:

- a shared `max-w-6xl` outer rail
- `wide` sections for data-heavy blocks
- `readable` sections with a left-aligned `max-w-3xl` inner column
- invite-page alignment to the same system

This is the narrowest design change that solves the actual problem: the settings pages are using a shell that is too small for the content they now contain.
