---
title: "API v1 reference"
description: "Starter read-only API routes, authentication header, success envelope, and common errors."
group: "API and integrations"
groupOrder: 700
parentItem: "API reference"
parentItemOrder: 80
order: 10
toc: true
purpose: "API reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# API v1 reference

The starter `/api/v1` routes are public from the browser-session perspective but require a valid API
key. Send the key in the `x-api-key` header.

```bash
curl -H "x-api-key: $API_KEY" http://localhost:3000/api/v1/me
```

## Response envelope

Successful responses use a `data` envelope:

```json
{
  "data": {}
}
```

Handled errors use an `error` envelope:

```json
{
  "error": {
    "code": "unauthorized",
    "message": "API key is required."
  }
}
```

## Endpoints

| Method and path | Purpose |
| --------------- | ------- |
| `GET /api/v1/me` | Returns the resolved API key principal. |
| `GET /api/v1/organizations` | Lists organizations visible to the principal. |
| `GET /api/v1/organizations/:organizationId` | Returns one visible organization. |
| `GET /api/v1/organizations/:organizationId/members` | Lists members in one organization. |
| `GET /api/v1/organizations/:organizationId/teams` | Lists teams in one organization. |
| `GET /api/v1/organizations/:organizationId/teams/:teamId/members` | Lists members in one team. |

## Principal rules

Personal keys resolve to a user principal. They can read organization data only while that user is a
member of the organization.

Workspace keys resolve to an organization principal. They can read only the organization that owns
the key.

## Common errors

| Status | Meaning |
| ------ | ------- |
| `401` | The key is missing or invalid. |
| `403` | The key is valid but lacks permission for the route or organization. |
| `404` | The requested organization or team is not visible to the key. |
| `429` | The key exceeded its rate limit. |

## Related pages

- [Manage API keys](/docs/api/api-keys)
- [Permissions and rate limits](/docs/api/permissions-rate-limits)
- [Add an API v1 endpoint](/docs/developers/api-v1-endpoint)
