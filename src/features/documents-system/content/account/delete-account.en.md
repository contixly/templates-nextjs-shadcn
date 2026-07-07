---
title: "Delete account"
description: "Understand the destructive account deletion surface and the confirmation required before it runs."
group: "Account"
groupOrder: 900
parentItem: "Danger zone"
parentItemOrder: 10
order: 10
toc: true
purpose: "Account deletion how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Delete account

The danger page contains destructive account actions. In the template, the primary destructive
account action is deleting the current user account.

## Before deletion

Account deletion is irreversible from the UI. Review connected providers, API keys, workspaces, and
pending invitations before continuing.

The template also revokes personal API keys owned by the deleted user. Workspace data is governed by
workspace and organization ownership rules.

## Delete the account

1. Open `/user/danger`.
2. Read the destructive action description.
3. Enter the account email exactly as requested.
4. Confirm deletion.

The action rejects mismatched confirmation input. This prevents accidental deletion from a casual
button click.

## Product extension note

If your service stores product data owned by the user, extend this flow with clear retention,
export, and transfer rules. Keep those rules visible on the danger page before the user confirms
deletion.

## Related pages

- [Account settings](/docs/account)
- [Personal API keys](/docs/api/api-keys)
- [Workspace settings](/docs/workspace/settings)
