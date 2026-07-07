---
title: "Caching"
description: "Use the template's Cache Components and optional Redis or Valkey backed cache handlers."
group: "Application"
groupOrder: 500
parentItem: "Runtime"
parentItemOrder: 90
order: 20
toc: true
purpose: "Caching reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Caching

The template uses Next.js Cache Components and repository-level cache tags. It can run with a local
fallback cache or a distributed Redis/Valkey-backed cache.

## Local default

By default, `REMOTE_CACHING_ENABLED=false`. This keeps local development simple and uses the local
fallback supplied by the custom cache handlers.

## Distributed cache

Enable distributed cache storage when multiple application instances need to share Cache Components
and ISR entries:

| Variable | Purpose |
| -------- | ------- |
| `REMOTE_CACHING_ENABLED` | Enables remote cache mode when set to `true`. |
| `REDIS_URL` or `VALKEY_URL` | Connection URL for the cache service. |
| `REDIS_PASSWORD` | Optional password when it is not already included in the URL. |
| `REMOTE_CACHING_PREFIX` | Prefix that isolates cache entries per app or environment. |

Use a unique prefix when sharing one Redis or Valkey service between environments.

## Feature cache invalidation

Repository reads use cache tags. Mutations refresh affected tags and paths so the UI can show fresh
workspace, account, team, invitation, and API key data.

## Related pages

- [Quick start](/docs/general/quick-start)
- [Server actions](/docs/developers/server-actions)
- [Runtime security](/docs/application/runtime-security)
