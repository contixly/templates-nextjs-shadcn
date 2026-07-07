---
title: "Email domains"
description: "Restrict workspace invitations by email domain and surface warnings for existing out-of-policy members."
group: "Workspace"
groupOrder: 800
parentItem: "Access policy"
parentItemOrder: 40
order: 10
toc: true
purpose: "Workspace access policy reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Email domains

Allowed email domains let a workspace restrict new invitations and direct member additions to
approved recipient domains.

## Configure allowed domains

Open workspace settings and edit the allowed email domain list. Domains are normalized before they
are stored, so product UI can treat `Example.com` and `example.com` as the same policy value.

An empty list means domain restrictions are disabled.

## Invitation checks

When restrictions are enabled, new invitations must target an allowed email domain. Invite acceptance
also checks the user's verified primary email against the invitation and the active domain policy.

If the domain is no longer allowed by the time the user accepts, the invitation cannot be accepted.

## Direct member add checks

When an admin adds an existing user directly, the template checks the user's email domain before
membership creation. Out-of-policy adds can require an explicit override flow.

## Existing members

Changing the domain policy does not remove existing members. Instead, the users page flags members
outside the current policy so admins can review them.

## Related pages

- [Members and roles](/docs/workspace/members-roles)
- [Invitations](/docs/workspace/invitations)
- [Workspace settings](/docs/workspace/settings)
