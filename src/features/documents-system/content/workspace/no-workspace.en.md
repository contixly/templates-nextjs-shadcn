---
title: "Users without a workspace"
description: "How the onboarding guard keeps workspace creation and invitation review available when no workspace is accessible."
group: "Workspace"
groupOrder: 800
parentItem: "Onboarding"
parentItemOrder: 30
order: 10
toc: true
purpose: "Workspace onboarding explanation"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Users without a workspace

A signed-in user can temporarily have no accessible workspace: they may be new, removed from an
organization, or waiting for an invitation. The template handles this state with a reusable
onboarding guard.

## What the guard does

The guard prevents protected workspace content from rendering without a valid organization context.
Instead, it directs the user toward actions that can restore access:

- create a workspace;
- review pending invitations;
- open account settings.

## What remains available

The zero-workspace state does not block global management pages. Users can still reach account
settings, the workspace management page, and their personal invitation list.

## Dashboard behavior

The global `/dashboard` route resolves the best available workspace. If the active workspace is not
valid, the app falls back to a deterministic accessible workspace. If none exists, the user is sent
to the welcome/onboarding surface.

## Related pages

- [Create and switch workspaces](/docs/workspace/create-switch)
- [Invitations](/docs/workspace/invitations)
- [Account settings](/docs/account)
