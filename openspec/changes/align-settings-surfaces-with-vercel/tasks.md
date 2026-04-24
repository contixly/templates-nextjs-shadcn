## 1. Shared Composition

- [ ] 1.1 Read the relevant Next.js local docs for App Router layouts/pages and Server/Client Component boundaries before coding.
- [ ] 1.2 Add shared settings composition primitives for page intro and section islands under `components/application/settings`.
- [ ] 1.3 Add focused tests for the shared settings composition primitives, including readable/wide rail behavior and semantic structure.

## 2. Account Settings Conversion

- [ ] 2.1 Convert the account profile page to render a contextual intro followed by separate islands for avatar, display name, email, user ID, and member-since details.
- [ ] 2.2 Convert the account connections page to render its provider list inside a section island with existing connect/disconnect behavior preserved.
- [ ] 2.3 Convert the account security page to render active sessions inside a section island with revoke actions preserved.
- [ ] 2.4 Convert the account danger page to render its destructive action inside a destructive section island with existing delete flow preserved.

## 3. Workspace Settings Conversion

- [ ] 3.1 Convert the workspace settings page to render a contextual intro and section islands for workspace identity/default settings and deletion when available.
- [ ] 3.2 Convert the workspace users page to render the current-user summary, other-users table, add-member action, and empty states as settings islands.
- [ ] 3.3 Convert the workspace invitations page to render invitation creation, invitation table, copy-link action, and empty state inside settings islands.
- [ ] 3.4 Convert workspace teams and roles placeholder pages to use the same intro and section island composition without exposing non-functional controls.

## 4. Copy And Theme Polish

- [ ] 4.1 Update account and workspace translations so page intros and section island titles/descriptions do not duplicate the same generic copy.
- [ ] 4.2 Verify light and dark theme contrast for page intros, islands, tables, inputs, buttons, empty states, and destructive sections.
- [ ] 4.3 Verify desktop and mobile layouts keep the settings navigation, content rail, tables/lists, and action rows readable without overlap.

## 5. Verification

- [ ] 5.1 Run focused settings component/page tests.
- [ ] 5.2 Run `npm run lint`.
- [ ] 5.3 Run `npm run test`.
- [ ] 5.4 Run `openspec validate --changes`.
