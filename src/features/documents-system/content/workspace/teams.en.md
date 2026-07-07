---
title: "Teams"
description: "Use explicit workspace teams for subgroups without changing the workspace membership model."
group: "Workspace"
groupOrder: 800
parentItem: "Teams"
parentItemOrder: 50
order: 10
toc: true
purpose: "Workspace team reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Teams

Teams are explicit subgroups inside a workspace. They are backed by Better Auth Teams but remain a
workspace feature in the user interface.

## Team model

New workspaces do not create a default team. The workspace organization is the all-members context,
and zero explicit teams is a valid state.

Team names are unique inside one workspace. Cross-workspace team membership is rejected.

## Manage teams

Authorized members can:

- create a team;
- rename a team;
- delete a team, including the last explicit team;
- add existing workspace members to a team;
- remove team members.

Regular members can view teams without seeing management controls.

## Team-targeted invitations

An invitation can optionally target a team. When the invitee accepts, the user joins the workspace
and the selected team. Invitations without a target team remain workspace-only.

## No active team control

The template does not expose active team switching or active team mutation. Teams are managed as
subgroups, not as a second routing context.

## Related pages

- [Members and roles](/docs/workspace/members-roles)
- [Invitations](/docs/workspace/invitations)
- [Workspace settings](/docs/workspace/settings)
