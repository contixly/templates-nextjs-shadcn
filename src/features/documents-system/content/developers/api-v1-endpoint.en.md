---
title: "Add an API v1 endpoint"
description: "Extend the starter API surface with a thin route handler, explicit permissions, and stable envelopes."
group: "For developers"
groupOrder: 300
parentItem: "API development"
parentItemOrder: 80
order: 10
toc: true
purpose: "Developer how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Add an API v1 endpoint

Use this flow when your product needs a new machine-readable endpoint under `/api/v1`.

## Choose the route

Add the route handler under `src/app/api/v1`. Keep the handler thin: parse request input, require an
API key, call feature/server modules, and return a stable response envelope.

## Define permissions

Add a concrete permission for the new endpoint. If several endpoints belong together, add or extend
a permission preset so users can configure keys without choosing every scope manually.

## Require API key auth

Use the API key auth helpers. Browser sessions should not grant access to `/api/v1`; the caller must
send `x-api-key`.

## Return stable responses

Successful responses should return `{ "data": ... }`. Handled failures should return
`{ "error": { "code": "...", "message": "..." } }` with an appropriate status.

## Document and test

Update [API v1 reference](/docs/api/api-v1), add or update OpenSpec requirements, and cover the
route through API-focused E2E or integration tests.

## Related pages

- [API access](/docs/api)
- [Permissions and rate limits](/docs/api/permissions-rate-limits)
- [OpenSpec, E2E, and docs](/docs/developers/openspec-e2e-docs)
