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

## Optional public edge cache

Cache Components and the Redis or Valkey handlers cache application data and ISR entries. They do
not cache a complete HTTP page for a visitor. An optional Nginx edge cache is a separate deployment
layer that can reuse the complete public response for documentation pages.

Nginx and Compose are optional. Local development and the root `Dockerfile` work without either of
them:

```bash
npm run dev
docker build -t nextjs-shadcn .
docker run --rm -p 3000:3000 --env-file .env nextjs-shadcn
```

Use the same normal application environment values that the standalone deployment requires. Do not
add Nginx, Compose, Redis, or Valkey just to run the template locally or as one Docker container.

For a Dokploy deployment that needs a shared documentation response cache, the optional topology is
defined in `infra/dokploy/compose.yml`. Traefik sends public traffic to Nginx, and Nginx sends it to
the Next.js web containers. PostgreSQL and Redis or Valkey stay external to this Compose file.

### What the edge may cache

The edge uses a positive allowlist. It may cache complete HTML only for `/docs` and published pages
below it, plus immutable assets under `/_next/static/`. Every other route is proxy-only and reports
`BYPASS`: this includes the home page, sign-in and protected application pages, APIs, server actions,
RSC and router-prefetch requests, generated documentation images, and requests with authorization.

This narrow boundary matters even when a route looks public. The edge must never store a response
that depends on a user, a cookie, a workspace, or a request-specific operation.

### Check an edge deployment

Nginx adds `X-Edge-Cache` (`MISS`, `HIT`, `BYPASS`, or `EXPIRED`) and `X-Edge-Replica` to proxied
responses. Use `GET /nginx-health` to check the Nginx process. Use `GET /api/health` directly on a
web container to check the Next.js application and its dependencies.

Before routing real traffic through the edge, run the verifier with its required origin URL, edge
URL, and a disposable authenticated test cookie supplied through your secure environment:

```bash
npm run test:public-cache
```

The verifier compares complete documentation responses for guest, authenticated, cookie, and safe
query requests. It also checks that both edge replicas warm from `MISS` to `HIT` and that private or
framework requests remain `BYPASS`. Do not copy cookies or other credentials into documentation,
shell history, or reports.

### Freshness and rollout

Documentation HTML remains in an edge cache for 60 minutes. Nginx does not serve stale HTML when the
origin fails; an expired entry waits for an origin response. Each edge replica has an ephemeral
cache, with no shared cache volume or per-page purge API. To invalidate every cached response during
a deployment, force-recreate every edge container.

Make the first Compose rollout manually. Verify both health endpoints, the allowlist and bypasses,
and a warm `HIT` on each replica before enabling auto-deploy later as a separate operational change.

## Related pages

- [Quick start](/docs/general/quick-start)
- [Server actions](/docs/developers/server-actions)
- [Runtime security](/docs/application/runtime-security)
