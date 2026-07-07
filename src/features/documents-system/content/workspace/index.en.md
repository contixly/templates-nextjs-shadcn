---
title: "Workspace"
description: "How the template models organization-backed workspaces, routes, members, teams, invitations, and settings."
group: "Workspace"
groupOrder: 800
parentItem: "Overview"
parentItemOrder: 100
order: 10
toc: true
purpose: "Workspace overview"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Workspace

Workspace is the user-facing name for an application working area. In the template, every workspace
is backed by a Better Auth Organization that stores members, roles, teams, invitations, API keys,
and access settings.

This page is the high-level map. Use the linked pages for task-specific guidance.

## Model

| Concept | Meaning |
| ------- | ------- |
| Workspace | Product-facing collaboration area shown to users. |
| Organization | Better Auth model that stores workspace membership and access data. |
| Organization key | The slug or id used in `/w/:organizationKey/...` routes. |
| Active workspace | The workspace selected in the user's current session. |
| Team | An explicit subgroup inside the workspace organization. |

Routes under `/w/:organizationKey/...` validate access before rendering. Deep links use the
workspace from the URL and do not silently rewrite the user's active workspace unless the user
switches context.

## What users can do

- Create and switch workspace context.
- Manage workspace details and allowed email domains.
- Review members and update assignable roles.
- Create invitations and copy invitation links.
- Accept or reject invitations after signing in.
- Create explicit teams and manage team membership.
- Create workspace API keys when permitted.

## Workspace documentation

- [Create and switch workspaces](/docs/workspace/create-switch)
- [Workspace settings](/docs/workspace/settings)
- [Members and roles](/docs/workspace/members-roles)
- [Invitations](/docs/workspace/invitations)
- [Teams](/docs/workspace/teams)
- [Email domains](/docs/workspace/email-domains)
- [Users without a workspace](/docs/workspace/no-workspace)

## Related pages

- [Account settings](/docs/account)
- [API access](/docs/api)
- [Application shell](/docs/application)
