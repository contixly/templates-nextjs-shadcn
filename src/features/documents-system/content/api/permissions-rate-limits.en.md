---
title: "Permissions and rate limits"
description: "How API key permissions, presets, expiration, and rate limits control machine access."
group: "API and integrations"
groupOrder: 700
parentItem: "Permissions"
parentItemOrder: 70
order: 10
toc: true
purpose: "API reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Permissions and rate limits

API keys are intentionally configurable. A key should carry only the permissions and lifetime that
its integration needs.

## Permission presets

Permission presets are reusable groups of scopes. The starter template uses presets for the
read-only organization API. Product teams can add presets for their own API routes.

Presets are expanded on the server before the key is created or updated. Unknown presets are
rejected, and custom permissions are preserved when unrelated fields change.

## Scopes

Scopes are the concrete permissions checked by API route handlers. A route should require the most
specific scope that describes what it returns or mutates.

The starter `/api/v1` surface is read-only. When your product adds write endpoints, add explicit
write scopes and document their effect before exposing them.

## Expiration

API keys can expire after configured durations or be created without expiration. Renewing
expiration is explicit during editing.

Use short expiration for temporary automation and longer expiration only for stable server-to-server
integrations with a rotation process.

## Rate limits

Each key can have a max request count and a time window. Rate-limited requests return `429` through
the stable API error envelope.

## Related pages

- [API access](/docs/api)
- [API v1 reference](/docs/api/api-v1)
- [Add an API v1 endpoint](/docs/developers/api-v1-endpoint)
