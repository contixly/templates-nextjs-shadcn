## 1. Invitation Integration Foundations

- [ ] 1.1 Add the Prisma migration and generated types for the composite unique constraint on workspace memberships
  `(organizationId, userId)`.
- [ ] 1.2 Add invitation DTOs, cache tags, repository queries, and page loaders for workspace-scoped invitation lists
  with derived display statuses and shareable invitation URLs.
- [ ] 1.3 Add the Better Auth integration needed to enforce verified-primary-email acceptance semantics for invitation
  accept/reject flows.
- [ ] 1.4 Add helpers or queries for current-user pending invitations addressed to the primary account email.

## 2. Workspace Admin Invitation Management

- [ ] 2.1 Implement protected server actions for creating invitations by email and directly adding an existing user to a
  workspace by user ID, including permission checks and cache invalidation.
- [ ] 2.2 Replace the workspace invitations placeholder page with a functional table, empty state, create-invitation
  modal, and copy-link actions.
- [ ] 2.3 Extend the workspace users settings page with an admin-only add-member-by-user-ID modal while keeping role
  edits and removals out of scope.

## 3. Recipient Invitation Flows

- [ ] 3.1 Add the dedicated invitation decision route and accept/reject actions that validate pending status, expiry,
  membership rules, and verified-primary-email eligibility.
- [ ] 3.2 Add the personal invitations page and reusable pending-invitations block backed by current-user invitation
  queries.
- [ ] 3.3 Mount the reusable invitations block on the welcome/onboarding experience when pending invitations exist and
  update navigation/routes/translations for the new personal invitation surface.

## 4. Verification

- [ ] 4.1 Add or update tests for invitation repositories, verified-primary-email eligibility resolution, duplicate-member
  protection, and protected server actions for create/add/accept/reject flows.
- [ ] 4.2 Add or update UI and route tests for the workspace invitations page, users page add-member control, personal
  invitations page, invitation decision route, and welcome/onboarding invitation block.
- [ ] 4.3 Run the focused lint and test suites covering workspace settings, primary-email invitation matching, and
  invitation recipient flows.
