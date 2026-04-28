## Context

The application already treats Better Auth organizations as the backing model for user-facing workspaces. Workspace
settings include real management surfaces for workspace details, users, invitations, and role assignment, while the
Teams page still renders placeholder content.

Better Auth `^1.6.9` is installed and its organization plugin includes team endpoints and schema support behind the
`teams.enabled` option. The current app has `organization()` configured with `activeOrganizationId`, but the Prisma
schema does not yet include `activeTeamId`, `Team`, `TeamMember`, or invitation `teamId` storage.

The change spans auth configuration, Prisma migrations, server actions, repository caching, workspace settings UI,
translations, and tests. It should preserve the existing product vocabulary: users see "workspace" and "team", while
implementation maps workspaces to Better Auth organizations.

## Goals / Non-Goals

**Goals:**

- Enable Better Auth Teams for existing organization-backed workspaces.
- Store teams and team memberships in the Prisma schema using Better Auth-compatible fields and table mappings.
- Replace the Teams settings placeholder with a functional workspace teams management surface.
- Allow authorized members to create, rename, delete, and inspect teams.
- Allow authorized members to add existing workspace members to teams and remove users from teams without removing them
  from the workspace.
- Allow workspace invitations to optionally target a team and add accepted invitees to that team.
- Support `session.activeTeamId` through Better Auth while keeping the current URL workspace context as the source of
  workspace routing truth.
- Keep the workspace organization itself as the implicit all-members context instead of creating automatic default teams.
- Enforce unique explicit team names within each workspace organization.
- Update public template copy and README documentation if they still describe Teams as upcoming or placeholder-only.

**Non-Goals:**

- Do not introduce team-scoped application resources, row-level data isolation, or team-specific project/document
  permissions in this change.
- Do not replace existing organization roles with per-team roles.
- Do not implement dynamic access-control roles or the roles settings page.
- Do not change workspace routing to include team slugs or team IDs.
- Do not allow team membership for users who are not members of the parent workspace organization.

## Decisions

### 1. Use Better Auth's built-in Teams support instead of custom team tables

Enable `teams: { enabled: true }` in `organization()` and `organizationClient()` and use Better Auth API methods for
team mutations where available.

Rationale:

- Better Auth already owns organization membership, invitations, and permission checks in this app.
- The installed plugin exposes team endpoints only when `teams.enabled` is true.
- Using Better Auth avoids a parallel membership model that could drift from organization membership.

Alternatives considered:

- Custom Prisma-only team models: rejected because accepted invitations, active team state, and permission checks would
  need duplicate logic outside Better Auth.
- Separate feature-level team abstraction unrelated to organizations: rejected because teams must belong to the current
  workspace organization.

### 2. Map Better Auth team tables to existing plural table naming

Add Prisma models that match Better Auth's expected logical fields while preserving project table naming conventions:

- `Team` mapped to `teams`
- `TeamMember` mapped to `team_members`
- `Session.activeTeamId`
- `Invitation.teamId`

Add indexes for foreign keys and a uniqueness guard for duplicate membership, at minimum `@@unique([teamId, userId])`
on `TeamMember`. `Team.organizationId` cascades on organization deletion, and `TeamMember.teamId` cascades on team
deletion.

Rationale:

- The project maps Better Auth auth tables to plural lowercase Postgres tables.
- Explicit Prisma models let repository code type-check against the generated Prisma client.
- A unique team membership constraint prevents duplicate rows even under concurrent add-member requests.

Alternatives considered:

- Keep Better Auth's singular table names: rejected because the current schema consistently maps auth entities to plural
  table names.
- Store team IDs as metadata on members: rejected because Better Auth team endpoints expect first-class team and
  team-member records.

### 3. Do not create automatic default teams

New workspaces should not create a Better Auth team automatically. The workspace organization itself is the implicit
all-members collaboration context; explicit teams are optional sub-groups created by admins only when needed.

Rationale:

- A default team duplicates the organization and makes the data model harder to explain.
- The current product has no team-scoped resources, so a default team would add rows without behavior.
- Future team-scoped resources can treat `teamId = null` as "whole workspace" and explicit `teamId` as subgroup scope.

Alternatives considered:

- Create a default team for every organization: rejected because it conflates organization membership with explicit
  team membership and creates unnecessary migration/backfill work.

### 4. Enforce unique explicit team names per workspace

Team names must be unique within a workspace organization. The implementation should trim names and reject duplicates
case-insensitively, so `Design` and `design` cannot coexist in the same workspace. A manual PostgreSQL unique index on
`organizationId` and `lower(name)` can enforce this at the database level if Prisma cannot express the index directly.

Rationale:

- Duplicate names make team selection in invitation and membership flows ambiguous.
- Case-insensitive uniqueness matches user expectations for names shown in UI.
- Database-level protection prevents concurrent requests from creating duplicate teams.

Alternatives considered:

- Rely on Better Auth default behavior, which does not require unique team names: rejected because this template's
  settings UI should keep team selection clear and deterministic.

### 5. Allow deleting any explicit team while no resources depend on it

The product should not enforce at least one explicit team. Authorized users may delete the last team because the
workspace organization remains the implicit all-members context. Once future resources reference teams, deletion must
block or require reassignment when resources still depend on that team.

Rationale:

- There are currently no team-scoped resources in the project.
- Keeping zero explicit teams valid preserves a simple workspace-only mode.
- Future resources can add their own deletion guards without changing the core team-management model.

Alternatives considered:

- Require at least one team after Teams are enabled: rejected because it would recreate the unwanted default-team
  concept.

### 6. Keep team management inside `features/workspaces`

Add a focused workspace teams slice beside existing workspace settings, invitations, users, and role management code:

- `workspaces-teams-types.ts`
- `workspaces-teams-schemas.ts`
- `workspaces-teams-repository.ts`
- `actions/create-workspace-team.ts`
- `actions/update-workspace-team.ts`
- `actions/delete-workspace-team.ts`
- `actions/add-workspace-team-member.ts`
- `actions/remove-workspace-team-member.ts`
- `actions/set-active-workspace-team.ts`

Rationale:

- The user-facing feature is "workspace teams", and the existing workspace slice already adapts Better Auth
  organization concepts to workspace UI terminology.
- Cross-feature imports should remain one-way: workspaces may use `features/organizations`, `lib`, `server`, and shared
  components, but features should not depend on each other.

Alternatives considered:

- Put teams in `features/organizations`: rejected for UI/application behavior because existing settings pages already
  live under `features/workspaces`.

### 7. Use repository reads with cache tags, server actions for mutations

Read teams through a repository using `"use cache"`, `cacheLife("hours")`, and tags such as:

- `CACHE_WorkspaceTeamsTag(organizationId)`
- `CACHE_WorkspaceTeamByIdTag(teamId)`
- `CACHE_WorkspaceTeamMembersTag(teamId)`

Mutations should be server actions using existing `createProtectedActionWithInput` patterns and must call `updateTag`
through the local cache helpers for affected team, workspace, member, and invitation tags.

Rationale:

- This follows the repository caching pattern already used by organizations and invitations.
- It keeps team reads stable under Cache Components mode while allowing explicit mutation invalidation.

Alternatives considered:

- Fetch all team data directly from client Better Auth calls: rejected because settings pages already use server
  loaders and protected server actions for authorization, caching, and error normalization.

### 8. Authorize team operations with Better Auth permissions and parent workspace membership

For every mutation:

- Resolve the workspace by `organizationId` and acting `userId`.
- Check Better Auth permissions with `hasWorkspacePermission`, using `team:create`, `team:update`, or `team:delete`
  where applicable.
- For team membership mutation, validate that both the team and target user belong to the same workspace organization
  before calling Better Auth `addTeamMember` or `removeTeamMember`.

Rationale:

- Better Auth defaults allow owners/admins to manage teams while regular members cannot.
- Parent organization membership validation prevents orphan team memberships or cross-workspace assignment.

Alternatives considered:

- Use only Prisma ownership checks: rejected because it would bypass Better Auth's organization permission model.

### 9. Treat active team as session preference, not route context

Expose a set-active-team server action that calls Better Auth `setActiveTeam`, but do not add team IDs to workspace
routes. Continue using `/w/:organizationKey/...` as the organization context.

Rationale:

- The current app deliberately treats URL workspace context as authoritative for organization-scoped pages.
- `activeTeamId` is useful for future team-aware flows but should not unexpectedly change the rendered workspace.

Alternatives considered:

- Add `/w/:organizationKey/t/:teamId/...` routes now: rejected because this change does not introduce team-scoped
  application resources.

### 10. Extend invitations with optional team targeting

Add `teamId` to invitation schemas, DTOs, and create-invitation UI as an optional field. When supplied, validate the
team belongs to the current workspace and pass `teamId` to Better Auth `createInvitation`. Invitation listing and
decision surfaces should show the target team when present.

Rationale:

- Better Auth can add accepted invitees to a specified team.
- Invitation targeting is the natural way to onboard a new user directly into a team without a second admin action.

Alternatives considered:

- Keep invitations workspace-only and require post-acceptance team assignment: viable but less complete for the Teams
  feature and leaves Better Auth `teamId` invitation support unused.

## Risks / Trade-offs

- [Better Auth schema mapping mismatch] → Verify generated Prisma client, run migrations locally, and test all team API
  calls against the mapped table/field names before relying on the UI.
- [Better Auth allows duplicate team names by default] → Add app-level validation and a database-level normalized
  uniqueness guard for team names inside each workspace organization.
- [Cache staleness after team mutations] → Define dedicated team cache tags and update all affected tags in every
  create/update/delete/member/invitation mutation.
- [Team membership can drift from organization membership] → Validate parent workspace membership before adding team
  members, cascade team members on team deletion, and remove/ignore team memberships when organization membership is
  removed in future member-removal work.
- [Team deletion may remove context for active sessions] → After deleting a team, clear or replace `activeTeamId` when
  the deleted team was active for the acting session; rely on Better Auth where possible and handle UI fallback when the
  active team no longer exists.
- [Invitation team target may become invalid before acceptance] → Treat deleted teams as a recoverable invitation state:
  accepting should still follow Better Auth behavior, and the decision surface should avoid promising team assignment
  when the target team no longer exists.
- [Scope creep into team-scoped authorization] → Keep this change limited to management and session preference; team
  permissions for future domain data require separate specs.

## Migration Plan

1. Update Better Auth server and client plugin configuration with `teams.enabled` and session `activeTeamId` field
   mapping.
2. Add Prisma models/fields and create a migration for teams, team members, invitation `teamId`, and session
   `activeTeamId`.
3. Regenerate Prisma client.
4. Add team repository, schemas, types, cache tags, and protected server actions.
5. Extend invitation schemas/actions/repositories/DTOs/components for optional `teamId`.
6. Replace the Teams placeholder page with the implemented settings UI and translations.
7. Update public home-page/template copy and README documentation where Teams are described as planned or placeholder.
8. Add focused tests for schema validation, authorization, cache invalidation, and repository/action behavior.
9. Run `npm run lint`, `npm run test`, and `npm run build`.

Rollback strategy:

- Disable `teams.enabled` in Better Auth configuration and revert the Teams UI/actions if the feature must be backed
  out before release.
- Database rollback should drop `team_members`, `teams`, `invitations.teamId`, and `sessions.activeTeamId` only after
  confirming no released code depends on those columns.

## Open Questions

- None at proposal time. Product decisions are captured above: no automatic default team, deleting the last explicit
  team is allowed while no resources depend on it, and team names are unique within a workspace.
