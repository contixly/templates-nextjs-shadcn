## Why

Workspace teams are useful as explicit subgroups for membership and invitations, but active team session selection is
not part of the product model. Keeping user-facing active team controls adds state that can drift from URL-based
workspace context and creates extra deletion edge cases without a current feature need.

## What Changes

- Remove the application UI that lets users set, clear, or switch an active workspace team.
- Remove the workspace server action and validation/error copy dedicated to setting active teams.
- Stop loading `session.activeTeamId` into the workspace Teams settings page.
- Simplify team deletion so it deletes the explicit team and team memberships without application-level active-team
  clearing logic.
- Preserve Better Auth's default organization teams behavior, including nullable session `activeTeamId`, the Prisma
  session field, and `defaultTeam.enabled: false`.
- Preserve team creation, rename, deletion, team membership management, and team-targeted invitations.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace-team-management`: Remove the requirement that workspace users can set or clear active team session context,
  while preserving team management and Better Auth team persistence.

## Impact

- Affected application code: workspace team settings page, workspace team settings context loader, set-active-team
  server action, team deletion action, workspace team schemas/errors/messages, and related tests.
- Affected OpenSpec specs: `workspace-team-management`.
- Not affected: Prisma `Session.activeTeamId` field, Better Auth
  `organization({ teams: { enabled: true, defaultTeam: { enabled: false } } })` configuration, Better Auth's built-in
  `/organization/set-active-team` endpoint, team tables, team memberships, or invitation `teamId`.
