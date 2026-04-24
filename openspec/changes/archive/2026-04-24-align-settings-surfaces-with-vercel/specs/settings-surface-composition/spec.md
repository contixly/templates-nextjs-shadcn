## ADDED Requirements

### Requirement: Settings Surfaces Use The Shared Settings Shell
The system MUST render account settings and organization-scoped workspace settings inside the shared settings shell with
section navigation on the left and a constrained content rail on the right.

#### Scenario: Account settings render in the shared shell

- **WHEN** an authenticated user opens a current-user settings route such as profile, invitations, connections,
  security, or danger
- **THEN** the system renders the user settings navigation in the settings shell
- **AND** renders the selected account settings page in the main content rail

#### Scenario: Workspace settings render in the shared shell

- **WHEN** an authenticated user opens an organization-scoped workspace settings route for an accessible workspace
- **THEN** the system renders the workspace settings navigation in the settings shell
- **AND** renders the selected workspace settings page in the main content rail

### Requirement: Settings Pages Start With A Contextual Intro
Each settings page MUST start its main content with a contextual intro block before rendering mutable or data-bearing
sections.

#### Scenario: Opening a settings page shows page context first

- **WHEN** an authenticated user opens any account settings or workspace settings page
- **THEN** the first visible element in the page content rail is a page intro with the page title
- **AND** the intro includes a concise description explaining what can be reviewed or changed on that page
- **AND** the intro is visually separate from the first form, table, empty state, or destructive action

#### Scenario: Page intro copy is not duplicated as an island title

- **WHEN** a settings page renders its first section island
- **THEN** that island uses a section-specific title and description
- **AND** does not repeat the same generic page title and description already shown in the page intro

### Requirement: Settings Data Is Grouped Into Section Islands
Settings pages MUST group editable fields, read-only details, tables, empty states, and related actions into bounded
section islands after the contextual intro.

#### Scenario: Form content is grouped by decision area

- **WHEN** a settings page renders editable fields
- **THEN** fields that represent the same user decision are grouped inside the same section island
- **AND** independent decisions use separate section islands instead of one monolithic card
- **AND** save, destructive, or secondary actions appear in the relevant island rather than in unrelated page chrome

#### Scenario: List content is grouped as a scannable island

- **WHEN** a settings page renders tabular or list data
- **THEN** the page places that table or list inside a section island with a clear title and optional action area
- **AND** the island preserves readable spacing and stable table/list boundaries on desktop and mobile viewports

#### Scenario: Empty states stay inside their owning island

- **WHEN** a settings section has no rows, accounts, sessions, invitations, or other records to show
- **THEN** the page renders the empty state inside the relevant section island
- **AND** keeps the island title and description visible so the empty state still has page context

### Requirement: Settings Surfaces Remain Readable In Light And Dark Themes
Settings surfaces MUST use semantic theme tokens so the content rail, intro, section islands, text, controls, borders,
tables, and danger states remain readable and visually distinct in both light and dark themes.

#### Scenario: Theme contrast remains stable

- **WHEN** a user views an account settings or workspace settings page in light or dark theme
- **THEN** page intro text, muted descriptions, island backgrounds, borders, inputs, tables, and primary actions remain
  readable against the page background
- **AND** the layout does not rely on hard-coded colors that only work in one theme

#### Scenario: Destructive sections remain distinct without overwhelming the page

- **WHEN** a settings page renders a destructive or irreversible action
- **THEN** the section uses destructive semantic color tokens for emphasis
- **AND** preserves enough contrast for the title, description, controls, and nested warning content in both themes
