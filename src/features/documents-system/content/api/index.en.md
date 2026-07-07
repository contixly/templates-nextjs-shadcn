---
title: "API access"
description: "How the template exposes machine access with personal and workspace API keys."
group: "API and integrations"
groupOrder: 700
parentItem: "Overview"
parentItemOrder: 100
order: 10
toc: true
purpose: "API user documentation"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# API access

The template includes machine access through Better Auth API keys and a starter `/api/v1` surface.
API clients authenticate with the `x-api-key` header. Browser session cookies are not accepted for
external API routes.

## Key families

| Key type | Managed from | Principal | Typical use |
| -------- | ------------ | --------- | ----------- |
| Personal API key | `/user/api-keys` | The owning user | Scripts and integrations that should follow user workspace membership. |
| Workspace API key | `/w/:organizationKey/settings/api-keys` | One workspace organization | Server integrations owned by a workspace. |

Both key families use the same external header and the same response envelope conventions.

## Starter API routes

The initial `/api/v1` routes expose read-only organization data:

- `GET /api/v1/me`
- `GET /api/v1/organizations`
- `GET /api/v1/organizations/:organizationId`
- `GET /api/v1/organizations/:organizationId/members`
- `GET /api/v1/organizations/:organizationId/teams`
- `GET /api/v1/organizations/:organizationId/teams/:teamId/members`

## Safety model

API key permissions, organization scope rules, expiration, and rate limits are checked before route
handlers return data. Product endpoints should extend those checks instead of reading raw Better Auth
payloads in route code.

## Related pages

- [Manage API keys](/docs/api/api-keys)
- [API v1 reference](/docs/api/api-v1)
- [Permissions and rate limits](/docs/api/permissions-rate-limits)
- [Add an API v1 endpoint](/docs/developers/api-v1-endpoint)
