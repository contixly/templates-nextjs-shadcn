---
title: "Invitations"
description: "Create workspace invitations, share links, accept or reject invitations, and target teams."
group: "Workspace"
groupOrder: 800
parentItem: "Invitations"
parentItemOrder: 60
order: 10
toc: true
purpose: "Workspace invitation how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Invitations

Workspace invitations let admins invite a user by email and optionally place the user into a team
after acceptance.

## Create an invitation

1. Open workspace settings.
2. Go to **Invitations**.
3. Choose **Create invitation**.
4. Enter the recipient email.
5. Select the role and, when needed, a target team.
6. Copy the invitation link.

The template rejects duplicate, redundant, domain-restricted, and unauthorized invitation requests.

## Invitation statuses

Invitation status is derived consistently from stored state and expiration. The admin table shows
pending, accepted, rejected, expired, or otherwise resolved invitations in one place.

## Accept or reject an invitation

Invitees open the invitation link after signing in. Anonymous visitors are returned to the
invitation route after login.

The decision page shows inviter, workspace, role, expiration, and target team when one was selected.
Acceptance requires the user's verified primary email to match the invitation and the active domain
policy.

## Personal invitation list

Users can review their own pending invitations from `/user/invitations`. The welcome page reuses the
same pending-invitations block for users who have no workspace yet.

## Related pages

- [Email domains](/docs/workspace/email-domains)
- [Teams](/docs/workspace/teams)
- [Users without a workspace](/docs/workspace/no-workspace)
