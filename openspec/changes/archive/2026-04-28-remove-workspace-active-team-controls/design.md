## Context

Workspace team management currently uses Better Auth Teams for explicit teams, team membership, and team-targeted
invitations. The application also added its own active team controls on the Teams settings page, a
`setActiveWorkspaceTeam` server action, `activeTeamId` page context, localized copy, and deletion logic that clears
active team state before removing a team.

Better Auth Teams includes nullable `activeTeamId` session support and a built-in set-active-team endpoint as part of
the plugin's default behavior. The product no longer needs to expose that behavior as a workspace feature. The workspace
URL and `session.activeOrganizationId` remain the source of workspace context.

## Goals / Non-Goals

**Goals:**

- Remove all application-owned active team controls from workspace team management.
- Keep Better Auth Teams enabled with `defaultTeam.enabled: false`.
- Keep Prisma session `activeTeamId` and Better Auth schema compatibility unchanged.
- Preserve create, rename, delete, member assignment, and team-targeted invitation flows.
- Simplify team deletion by relying on database and Better Auth defaults instead of explicit active-team clearing.

**Non-Goals:**

- Do not remove Better Auth Teams support.
- Do not drop `sessions.activeTeamId` or its foreign key/index.
- Do not disable Better Auth's built-in `/organization/set-active-team` endpoint.
- Do not change workspace context routing or `session.activeOrganizationId` behavior.
- Do not remove team-targeted invitations.

## Decisions

### Remove only the product-owned active team layer

The implementation will remove the UI control, server action, schema, errors, messages, context plumbing, and tests
whose purpose is setting, clearing, or displaying an active team.

Alternative considered: dropping `Session.activeTeamId` and disabling all Better Auth active-team behavior. This was
rejected because the current request is to preserve Better Auth's default behavior and database schema.

### Keep Better Auth team defaults intact

`organization({ teams: { enabled: true, defaultTeam: { enabled: false } } })` remains configured. This preserves Better
Auth team APIs and prevents automatic default team creation for new workspaces.

Alternative considered: removing the `defaultTeam` option. This was rejected because Better Auth's default can create a
default team when organizations are created.

### Do not read `activeTeamId` for rendering

The Teams settings page will load teams, team members, assignable members, and permissions without loading the current
session solely to derive `activeTeamId`. Team cards will not render active badges or set/clear controls.

Alternative considered: keep reading `activeTeamId` but hide controls. This was rejected because it preserves
unnecessary state coupling and tests for behavior the product no longer exposes.

### Simplify team deletion

The delete action will remove the team through the existing Better Auth team deletion flow without application-level
`getSession`/`setActiveTeam(null)` handling. Existing nullable database behavior can clear stale `activeTeamId` if the
deleted team is referenced by a session.

Alternative considered: preserve explicit active-team clearing during deletion as cleanup. This was rejected because it
keeps active-team management semantics inside the application after the user-facing feature is removed.

## Risks / Trade-offs

- [Existing sessions may still contain `activeTeamId`] → This is acceptable; the application no longer reads it for
  workspace team UI, and the field remains nullable for Better Auth compatibility.
- [Better Auth still exposes its built-in set-active-team endpoint] → This is acceptable because this change removes
  product-owned controls, not Better Auth defaults.
- [Deleting a team that is active in the current session may depend on Better Auth behavior] → Tests should verify the
  simplified delete path. If Better Auth rejects deletion when headers identify an active team, the action can continue
  using the existing header-omission pattern without calling `setActiveTeam(null)`.
- [Tests may still assert active team labels and copy] → Update tests to assert the absence of active controls and
  remove set-active-team action coverage.
