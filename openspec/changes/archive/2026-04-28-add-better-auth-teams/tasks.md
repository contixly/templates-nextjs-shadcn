## 1. Auth And Database Setup

- [x] 1.1 Read the relevant local Next.js docs under `node_modules/next/dist/docs/` for server actions, caching, and
  route rendering before changing Next.js code.
- [x] 1.2 Enable Better Auth Teams in `src/server/auth.ts`, including `teams.enabled` and `session.fields.activeTeamId`.
- [x] 1.3 Enable Better Auth Teams in `src/lib/auth-client.ts` while preserving
  `inferOrgAdditionalFields<typeof auth>()`.
- [x] 1.4 Add Prisma schema fields and models for `Session.activeTeamId`, `Invitation.teamId`, `Team`, and `TeamMember`
  with project-standard table mappings, indexes, relations, cascades, duplicate team-member protection, and normalized
  per-workspace team-name uniqueness.
- [x] 1.5 Create and apply a Prisma migration named for Better Auth Teams, then regenerate the Prisma client.

## 2. Workspace Teams Domain Layer

- [x] 2.1 Add workspace team DTOs, cache tag helpers, and mutation invalidation helpers.
- [x] 2.2 Add workspace team Zod schemas for team create, team update, team delete, team member add/remove, and
  active-team selection, including trimmed team-name normalization.
- [x] 2.3 Add a cached workspace teams repository for listing teams, loading team details, loading team members, and
  validating team ownership within a workspace organization.
- [x] 2.4 Add protected server actions for creating, renaming, deleting, and setting active workspace teams.
- [x] 2.5 Add protected server actions for adding existing workspace members to teams and removing team members without
  changing organization membership.
- [x] 2.6 Ensure workspace creation does not create an automatic default team and that zero explicit teams remains a
  valid workspace state.
- [x] 2.7 Normalize Better Auth and Prisma errors into workspace error keys for invalid team input, duplicate team
  names, duplicate membership, missing teams, cross-workspace targets, and permission denial.

## 3. Teams Settings UI

- [x] 3.1 Extend workspace settings context loading with teams data and team permissions.
- [x] 3.2 Replace the teams settings placeholder page with an implemented server page that handles canonical workspace
  redirects and inaccessible workspace states.
- [x] 3.3 Build the teams list surface with empty state, member counts, read-only mode for regular members, and
  permission-gated create/update/delete controls.
- [x] 3.4 Build team create and rename forms using React Hook Form, Zod, shared Field components, `useTransition`, and
  Sonner feedback.
- [x] 3.5 Build team membership controls for listing members, adding existing workspace members, removing team members,
  and showing validation feedback.
- [x] 3.6 Allow authorized users to delete any explicit team, including the last explicit team, while showing the teams
  empty state afterward.
- [x] 3.7 Add English and Russian messages for teams management, duplicate team names, validation errors, empty states,
  and permission-gated controls.

## 4. Invitation Team Targeting

- [x] 4.1 Extend invitation schemas, types, DTOs, and repository selects with optional `teamId` and team display data.
- [x] 4.2 Extend create-invitation authorization to validate that selected teams belong to the current workspace
  organization.
- [x] 4.3 Pass optional `teamId` to Better Auth invitation creation and update invitation cache tags after team-targeted
  invitations.
- [x] 4.4 Update the create-invitation modal to allow optional team selection from current workspace teams only.
- [x] 4.5 Update invitation tables, invitation decision pages, personal invitations, and welcome invitations to display
  target team information when present.

## 5. Public Copy And Documentation

- [x] 5.1 Update the public home page and localized application messages if the feature list still describes Teams as
  upcoming, placeholder-only, or unavailable.
- [x] 5.2 Update `README.md` to describe Better Auth Teams, explicit team management, optional team-targeted
  invitations, and the no-default-team behavior if the existing README becomes stale after implementation.

## 6. Tests And Verification

- [x] 6.1 Add or update tests for workspace team schema validation, repository team loading, team-name uniqueness, and
  team cache tag invalidation.
- [x] 6.2 Add or update tests for protected team actions covering authorized success, unauthorized rejection,
  cross-workspace rejection, duplicate team names, duplicate team membership, deleting the last explicit team, and no
  automatic default team on workspace creation.
- [x] 6.3 Add or update tests for invitation creation with no team, valid team target, invalid team target, and accepted
  team-targeted invitations.
- [x] 6.4 Add or update page/component tests for the implemented teams settings page, read-only mode, empty state, and
  permission-gated controls.
- [x] 6.5 Run `npm run lint`.
- [x] 6.6 Run `npm run test`.
- [x] 6.7 Run `npm run build`.
