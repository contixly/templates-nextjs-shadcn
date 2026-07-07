---
title: "Manage API keys"
description: "Create, edit, and delete personal and workspace API keys safely."
group: "API and integrations"
groupOrder: 700
parentItem: "Key management"
parentItemOrder: 90
order: 10
toc: true
purpose: "API key how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Manage API keys

API keys let machines call `/api/v1` without a browser session. The template separates personal keys
from workspace keys so users can choose the principal intentionally.

## Create a personal key

1. Open `/user/api-keys`.
2. Choose **Create key**.
3. Enter a name that helps identify the integration.
4. Select permission presets, expiration, and rate limit settings.
5. Copy the secret when it is shown.

The secret is shown once. Store it in the integration's secret manager before closing the dialog.

## Create a workspace key

1. Open the workspace settings page.
2. Go to **API keys**.
3. Create the key from the workspace-owned surface.

Workspace keys act as one organization. They are visible only when the current member has permission
to read or manage workspace API keys.

## Edit a key

Editing a key can change its name, permissions, expiration, or rate limit settings. Expiration
renewal is explicit so a stale key is not silently extended.

## Delete a key

Delete keys that are no longer used. Personal keys are revoked when the owner account is deleted.
Workspace keys are revoked when the workspace organization is deleted.

## Related pages

- [API access](/docs/api)
- [Permissions and rate limits](/docs/api/permissions-rate-limits)
- [Workspace settings](/docs/workspace/settings)
