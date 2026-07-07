---
title: "Members and roles"
description: "Workspace member directory, built-in roles, direct member addition, and role updates."
group: "Workspace"
groupOrder: 800
parentItem: "Members"
parentItemOrder: 70
order: 10
toc: true
purpose: "Workspace user management reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Members and roles

The users settings page lists workspace members and exposes role-aware management controls.

## Built-in roles

The template starts with three manageable roles:

| Role | Typical responsibility |
| ---- | ---------------------- |
| Owner | Full workspace ownership, including destructive workspace actions. |
| Admin | Workspace management such as users, teams, invitations, and settings. |
| Member | Read access to safe workspace context and product surfaces. |

Product teams can extend role behavior, but should keep the visible meaning of each role clear in
workspace settings.

## Member directory

All accessible members can review the user directory. The current user is identified separately, and
other members are shown in a table.

If the workspace has no returned members, the page keeps the empty state inside the users section
instead of losing the settings context.

## Add an existing user

Authorized members can add an existing user by id. Domain restrictions are checked before membership
is created. If the user is outside the active policy, the UI can require an explicit override before
continuing.

## Update roles

Authorized members can update assignable roles from the member table. The template rejects
disallowed, redundant, or unauthorized role changes.

Member removal is intentionally not exposed in the current starter surface.

## Related pages

- [Email domains](/docs/workspace/email-domains)
- [Invitations](/docs/workspace/invitations)
- [Teams](/docs/workspace/teams)
