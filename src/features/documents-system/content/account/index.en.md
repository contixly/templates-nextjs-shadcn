---
title: "Account settings"
description: "How users manage profile details, connected providers, sessions, invitations, API keys, and account deletion."
group: "Account"
groupOrder: 900
parentItem: "Overview"
parentItemOrder: 100
order: 10
toc: true
purpose: "Account user documentation"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Account settings

Account settings are the user's global management area. They are not tied to one workspace and stay
available even when the user has no accessible workspaces.

The template includes dedicated account sections for profile identity, connected OAuth providers,
active sessions, pending workspace invitations, personal API keys, and destructive account deletion.

## Account sections

| Section | Route | What it is for |
| ------- | ----- | -------------- |
| Profile | `/user/profile` | Review account identity and update the display name. |
| Connections | `/user/connections` | Link or unlink configured OAuth providers. |
| Security | `/user/security` | Review active sessions and revoke access. |
| Invitations | `/user/invitations` | Review workspace invitations addressed to the current user. |
| API keys | `/user/api-keys` | Manage personal API keys for `/api/v1`. |
| Danger | `/user/danger` | Delete the current account after explicit confirmation. |

## Access model

All account settings require a signed-in user. Server actions load the current session on the
server, validate input, apply the mutation, and refresh affected cache state before returning a
result to the UI.

## When to use account settings

Use account settings for personal identity and access choices. Use workspace settings when the
change belongs to one organization-backed workspace, such as members, teams, workspace API keys, or
allowed email domains.

## Related pages

- [Profile and connections](/docs/account/profile-connections)
- [Sessions and security](/docs/account/sessions-security)
- [Personal API keys](/docs/api/api-keys)
- [Invitations](/docs/workspace/invitations)
