## 1. Remove Active Team Server Surface

- [x] 1.1 Read the relevant local Next.js docs before editing Next.js server actions or route-bound components.
- [x] 1.2 Remove the `setActiveWorkspaceTeam` server action and its direct exports/imports.
- [x] 1.3 Remove the set-active-team schema/type and active-team-specific workspace error keys/messages.
- [x] 1.4 Simplify `deleteWorkspaceTeam` so deletion no longer calls `auth.api.getSession` or `auth.api.setActiveTeam`.

## 2. Remove Active Team UI Surface

- [x] 2.1 Stop loading `activeTeamId` in the workspace teams settings page context.
- [x] 2.2 Remove `activeTeamId` props from the teams route page and `WorkspaceSettingsTeamsPage`.
- [x] 2.3 Remove `TeamActiveControl`, active badges, and set/clear active team buttons from team cards.
- [x] 2.4 Keep create, rename, delete, add-member, and remove-member controls permission-gated as before.

## 3. Update Tests and Verification

- [x] 3.1 Update workspace team action tests to remove set-active-team coverage and assert simplified team deletion behavior.
- [x] 3.2 Update teams page and schema tests so they assert no active-team controls or schema remain in the workspace feature.
- [x] 3.3 Run focused workspace team tests.
- [x] 3.4 Run lint or the repository's broader validation command needed for the touched files.
