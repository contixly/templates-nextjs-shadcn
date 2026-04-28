## Why

Workspace settings already reserve a Teams section, but the application currently has no Better Auth Teams schema,
server configuration, or working management surface behind it. Enabling Better Auth Teams now turns the existing
organization-backed workspace model into a usable collaboration structure without introducing a separate tenant concept.

## What Changes

- Enable Better Auth Teams in the existing `organization()` server plugin and `organizationClient()` client plugin.
- Extend the Prisma auth schema and migration history with Better Auth team storage: `teams`, `team_members`,
  `sessions.activeTeamId`, and optional `invitations.teamId`.
- Replace the workspace Teams placeholder page with a real organization-scoped management surface for listing teams,
  creating teams, editing team names, deleting teams, and viewing team members.
- Add authorized server actions and repository/cache support for team reads and team mutations following the existing
  workspace FSD and `ActionResult<T>` patterns.
- Allow authorized members to add existing workspace members to teams and remove team members without changing their
  organization membership or role.
- Allow workspace invitations to optionally target a team so accepted invitations join both the workspace organization
  and the selected team.
- Support setting the active team in the Better Auth session while preserving the existing URL-based workspace context.
- Do not create automatic default teams for new workspaces; the workspace organization itself remains the implicit
  all-members collaboration context.
- Enforce unique explicit team names within each workspace organization.
- Update public template copy and README documentation where the shipped feature list currently describes Teams as an
  upcoming placeholder.

## Capabilities

### New Capabilities

- `workspace-team-management`: Workspace settings expose Better Auth Teams for organization-backed workspaces, including
  team CRUD, team membership management, team invitation targeting, and active-team session context.

### Modified Capabilities

- `workspace-settings-navigation`: The Teams settings section changes from a placeholder route to an implemented
  workspace management surface.
- `workspace-invitation-management`: Workspace invitation creation and acceptance support optional team assignment.

## Impact

- Affected code: Better Auth configuration in `src/server/auth.ts` and `src/lib/auth-client.ts`, Prisma schema and
  migrations, generated Prisma client, workspace settings routes under
  `src/app/(protected)/(global)/w/[organizationKey]/settings/teams`, workspace invitation actions/components, workspace
  repositories, cache tags, translations, public home-page copy, README documentation, and tests.
- Affected APIs: Better Auth organization team APIs including create/list/update/remove team, set active team, list team
  members, add team member, and remove team member.
- Affected systems: workspace settings UI, organization-scoped authorization, repository caching, session context, and
  invitation acceptance.
- Dependencies: no new runtime dependency is expected; the change uses Better Auth Teams support already available from
  the installed Better Auth organization plugin.
