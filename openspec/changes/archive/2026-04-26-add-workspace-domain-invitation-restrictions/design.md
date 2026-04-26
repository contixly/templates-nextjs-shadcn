## Context

Workspaces are backed by Better Auth organizations while the UI keeps the workspace terminology. Workspace settings
already load an `OrganizationWorkspaceDto` that includes parsed organization metadata, and mutations already flow through
server actions with tag-based cache invalidation. Invitations, invitation acceptance, direct member addition, and the
users table all live in the `workspaces` feature slice, so the restriction logic can stay inside that feature while
reusing organization repository data.

The current system allows any email address to receive an invitation and allows direct member addition by user ID when
the acting member has the required permissions. Existing members are listed without policy status.

## Goals / Non-Goals

**Goals:**

- Let workspace admins configure zero or more allowed email domains from workspace settings.
- Treat an empty allowed-domain list as disabled restrictions.
- Block new invitations and invitation acceptance when the recipient email domain is outside the active restrictions.
- Keep direct add-by-user-ID as an explicit admin override, but warn before adding an out-of-policy user.
- Surface out-of-policy existing members in the users page without removing or disabling them automatically.
- Keep the implementation inside existing feature slices, action helpers, cache tags, and settings UI patterns.

**Non-Goals:**

- Verifying domain ownership, DNS, MX records, or email deliverability.
- Supporting wildcard domains, suffix matching, or subdomain inheritance.
- Removing, suspending, or role-changing existing members automatically.
- Applying workspace domain restrictions to global account signup or OAuth login.

## Decisions

1. Store allowed domains in organization metadata under a workspace-owned key such as `allowedEmailDomains`.

   The existing organization DTO already parses metadata, and domain restrictions are only needed after loading a
   specific workspace by ID or route key. This avoids a new table for a small settings array and keeps Better Auth's
   organization model as the source of workspace settings. A dedicated table was considered, but it adds joins and CRUD
   surfaces without a current need to query workspaces by domain.

2. Normalize domains once and match exact email domains only.

   Domain values will be trimmed, lowercased, stripped of a leading `@`, deduplicated, and validated as domain names.
   Email eligibility compares the normalized part after the final `@` to the configured list. `example.com` does not
   match `sub.example.com`; admins must add each domain explicitly. This keeps policy behavior predictable and easy to
   test.

3. Invitations are hard-gated by the active domain restrictions.

   Create-invitation rejects an out-of-policy recipient before calling Better Auth. Invitation acceptance re-checks the
   active restrictions so invitations created before a settings change cannot add an ineligible user later. This second
   check is required because settings can change while an invitation is still pending.

4. Direct add-by-user-ID warns first and then permits an explicit override.

   The direct-add flow is already an admin-only path and does not depend on invitation email delivery. When the target
   user's email domain is outside the allowed list, the server action returns a structured warning state without adding
   the member. The dialog renders the warning and lets the admin resubmit with an acknowledgement flag. Confirmed
   overrides add the member and the users table marks them as outside the current policy.

5. Member policy status is derived at read time.

   The users settings context will combine the workspace allowed domains with member email addresses and pass
   `isOutsideAllowedEmailDomains`-style data to the UI. Policy status is not persisted on each member, because it can be
   derived from the current setting and would otherwise become stale whenever restrictions change.

6. Cache invalidation follows the existing workspace/member tags.

   Updating allowed domains must invalidate the workspace organization tag and the organization members tag because the
   users table warning state depends on both the setting and the member list. Invitation creation and invitation
   acceptance keep using their current invitation and member cache invalidation paths, with the added domain check before
   mutation.

## Risks / Trade-offs

- Metadata updates can overwrite unrelated metadata keys -> use a small helper that reads, merges, normalizes, and
  writes only the workspace-owned allowed-domain key.
- Pending invitations can become invalid after admins tighten restrictions -> re-check restrictions on the decision
  page and accept action, and show an explicit domain-restriction state.
- Existing members can fall outside a new restriction -> mark and warn instead of mutating membership automatically.
- Direct override can confuse admins -> require an acknowledgement step and keep the out-of-policy marker visible after
  the override succeeds.
- Exact matching may surprise teams that expect subdomain inheritance -> document the exact-match behavior in field
  help text and require subdomains to be listed explicitly.

## Migration Plan

No database migration is required if the implementation stores the normalized array in existing organization metadata.
Deployment can roll out in one application release:

1. Add metadata parsing/normalization helpers and extend workspace settings schemas/actions.
2. Add invitation and direct-member checks behind the existing server actions.
3. Add users-table policy markers and warning copy.
4. Add tests for settings normalization, invitation rejection, invitation acceptance rejection, direct-add warning, and
   users-table markers.

Rollback is application-only: remove the UI and server-action checks, and leave the metadata key unused. Existing
memberships and invitations remain valid data.

## Open Questions

None for this proposal. The design assumes exact domain matching and an acknowledged admin override for direct member
addition.
