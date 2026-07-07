---
title: "Server actions"
description: "Use the template's protected action pattern for validated, authorized, cache-aware mutations."
group: "For developers"
groupOrder: 300
parentItem: "Project development"
parentItemOrder: 100
order: 30
toc: true
purpose: "Developer how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Server actions

All product mutations should use server actions unless they are framework or external API surfaces.
This keeps validation, authorization, mutation, cache refresh, and result shape consistent.

## Action flow

Every action should follow the same sequence:

1. Validate input with Zod.
2. Load the authenticated user on the server.
3. Authorize access to the target entity.
4. Mutate data with Prisma.
5. Refresh cache tags and affected paths.
6. Return an `ActionResult`.

## Protected helpers

Use the shared protected action helpers instead of reimplementing auth and error handling in each
feature:

- `createProtectedActionWithInput` for actions that accept validated input;
- `createProtectedAction` for actions without input.

## Cache refresh

Server actions should use cache tag helpers from the feature types file. Route handlers that mutate
data should revalidate affected paths.

## Error handling

Return user-safe error messages and stable error codes. Log implementation details through the
feature logger instead of exposing them in the UI.

## Related pages

- [Feature slice architecture](/docs/developers/feature-slice)
- [Caching](/docs/application/caching)
- [OpenSpec, E2E, and docs](/docs/developers/openspec-e2e-docs)
