---
title: "Workspace settings"
description: "Workspace settings sections, permissions, and the shared settings shell."
group: "Workspace"
groupOrder: 800
parentItem: "Settings"
parentItemOrder: 80
order: 10
toc: true
purpose: "Workspace settings reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Workspace settings

Workspace settings are split into dedicated section pages. This keeps each management task focused
and lets the navigation show only sections the current member can use.

## Settings sections

| Section | Route | What it contains |
| ------- | ----- | ---------------- |
| Workspace | `/w/:organizationKey/settings/workspace` | Workspace name, slug, and allowed email domains. |
| Users | `/w/:organizationKey/settings/users` | Current user summary, member list, direct member add, and role controls. |
| Invitations | `/w/:organizationKey/settings/invitations` | Invitation table, statuses, links, and create-invitation modal. |
| Teams | `/w/:organizationKey/settings/teams` | Explicit workspace teams and team membership management. |
| Roles | `/w/:organizationKey/settings/roles` | Placeholder for future role expansion. |
| API keys | `/w/:organizationKey/settings/api-keys` | Workspace-owned API keys for `/api/v1`. |

The settings root redirects to the first available section after access validation.

## Permissions

Regular members can read safe settings context such as member lists and teams. Management controls
appear only for members whose role permits the action.

The invitations and API key sections are conditional: users without the required permissions do not
see management actions and may not see the section link at all.

## Shared settings shell

Account settings and workspace settings use the same visual shell: contextual intro first, then
section islands for forms, lists, and empty states. This keeps dense operational pages readable in
light and dark themes.

## Related pages

- [Members and roles](/docs/workspace/members-roles)
- [Invitations](/docs/workspace/invitations)
- [Teams](/docs/workspace/teams)
- [Settings shell](/docs/application/settings-shell)
