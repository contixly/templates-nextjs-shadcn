# Optional Public Edge Cache for Documentation

**Date:** 2026-09-03
**Status:** approved in chat

## Purpose

The public documentation under `/docs` is safe to serve to every visitor only when its complete
HTML is independent of authentication, cookies, and other viewer-specific state. Today the
documentation layout reads the `sidebar_state` cookie on the server, so two otherwise identical
requests can produce different HTML and Next.js marks the response as private. This prevents a
shared HTTP cache from safely reusing the document.

This change makes documentation HTML identical for all visitors and adds an optional Nginx response
cache for Dokploy deployments. The optimization follows the proven shape used by the donor project,
but uses a narrower allowlist because this template contains substantially more authenticated and
personal data.

The cache is deployment infrastructure, not an application requirement. The template must continue
to run locally and as a standalone Docker container without Nginx or Docker Compose.

## Product and OpenSpec boundary

This is an engineering and deployment change, not a new business workflow. The documentation URL,
content, permissions, navigation, and sidebar controls remain the same. The only visible compromise
is that the first server-rendered frame always has the desktop documentation sidebar closed; after
hydration the browser restores a previously saved open state.

No OpenSpec capability or change is created for this work. The implementation is described in this
engineering design and in public deployment/caching documentation. If later work changes a
user-visible workflow, authorization rule, or API contract, that separate behavior still follows the
normal OpenSpec process.

## Current state

- The root `Dockerfile` produces a standalone Next.js image listening on port `3000` and exposing
  `/api/health`.
- The live Dokploy service is currently an Application built from that Dockerfile, with two web
  replicas and the public domain routed directly to port `3000`.
- PostgreSQL and Dragonfly/Redis are external services and are not owned by this application
  deployment.
- The documentation layout reads `sidebar_state` through `cookies()` on the server. That request
  dependency makes the complete `/docs` response vary by cookie even though the documentation
  content itself is public.
- Cache Components and the optional Redis/Valkey handlers remain the application-level cache. They
  do not replace an HTTP response cache and remain useful with or without Nginx.

## Supported runtime modes

The repository supports three independent runtime modes after this change.

### 1. Local development

`npm run dev` starts Next.js directly. It does not require Nginx, Compose, Redis, or Valkey. The
documentation sidebar restoration works entirely in the browser.

### 2. Standalone Docker

The root `Dockerfile` remains a complete deployable application. A platform such as Docker,
Coolify, or a regular Dokploy Application can route traffic directly to port `3000`. The image keeps
its existing command and `/api/health` contract. No edge-cache environment variable is required by
the application.

### 3. Optional Dokploy Compose topology

The repository adds an opt-in deployment under `infra/dokploy`:

```text
Traefik -> edge:8080 (Nginx x2) -> web:3000 (Next.js x2)
                                      |
                                      +-> existing external PostgreSQL
                                      +-> existing external Dragonfly/Redis
```

Traefik owns TLS and routes the public domain only to `edge:8080`. Nginx and Next.js share the
private Dokploy network. The `web` service uses the unchanged root Dockerfile. Compose owns only
`edge` and `web`; it does not create, migrate, delete, or attach volumes for PostgreSQL or
Dragonfly/Redis.

The first rollout uses two edge and two web replicas. Each edge replica has its own ephemeral cache.
There is no shared Nginx cache volume.

## Documentation sidebar data flow

The documentation layout stops reading `sidebar_state` on the server. It always renders the public
server document with the desktop sidebar closed.

A documents-system-specific client provider owns the restored desktop state:

1. Its initial React state is `false`, matching the server HTML exactly.
2. After hydration it reads the existing `sidebar_state` browser cookie.
3. Only the literal JSON boolean `true` opens the sidebar. A missing, malformed, or `false` value
   leaves it closed.
4. It passes controlled `open` and `onOpenChange` values to the existing Shadcn
   `SidebarProvider`.
5. The existing provider continues to write `sidebar_state` when the user toggles the sidebar.

This deliberately accepts a small post-hydration expansion for a returning visitor whose saved
state is open. It avoids cookie-dependent server HTML and therefore makes the full public document
safe to compare and cache. The base `src/components/ui/sidebar.tsx` component is not modified; the
behavior is composed inside the documents-system feature.

## Edge cache boundary

The Nginx configuration uses a strict positive allowlist. Only the following requests are eligible:

- the canonical `/docs` path;
- published documentation pages under `/docs/<slug>`;
- immutable assets under `/_next/static/`.

The HTML key consists of scheme, host, and canonical pathname. Ordinary query parameters are not
part of the key because documentation pages do not use them to select content. This prevents
tracking parameters from producing unbounded duplicate entries. A redirect response is never
stored, so URL canonicalization remains Next.js's responsibility.

Documentation HTML has a 60-minute shared-cache lifetime. Browsers must revalidate HTML while the
shared edge cache may reuse it. Immutable Next.js assets keep their long-lived immutable policy.
Nginx may normalize origin compression and perform gzip itself so supported clients can reuse the
same stored representation.

Cookies are deliberately excluded from the HTML cache key. They are still forwarded to Next.js on
an origin miss, but eligibility requires prior proof that complete guest, authenticated, and
sidebar-cookie response bodies are byte-identical and contain no private data.

## Mandatory bypasses

Every route not explicitly allowlisted is proxy-only. This includes the home page, authentication,
protected application pages, invitations, workspaces, profiles, settings, and all other potentially
personalized content.

The following are always bypassed and never stored, even if the pathname starts with `/docs`:

- `/docs/og/**`;
- `opengraph-image`, `twitter-image`, icon, and other generated image routes;
- `/api/**`, including `/api/health`;
- React Server Component requests;
- Next.js router-state and router-prefetch requests;
- Server Actions;
- requests with `Authorization`;
- requests with `Purpose: prefetch`;
- every method except `GET` and `HEAD`.

An eligible request is stored only when the upstream response:

- returns status `200`;
- does not contain `Set-Cookie`;
- does not declare `Cache-Control: private`, `no-store`, or `no-cache`;
- does not declare `Vary: *`.

These response checks are defense in depth. The primary safety proof is the narrow path allowlist
and byte-for-byte HTML equality before edge deployment.

## Freshness, failures, and invalidation

`proxy_cache_lock` collapses concurrent cold requests within one edge replica. With independent
replica caches, a cold path can still reach Next.js once per replica. The design accepts that bounded
duplication instead of introducing shared cache storage or coordination.

Expired HTML waits for an origin response. Nginx does not serve stale documentation after the
60-minute lifetime. Errors, redirects, missing pages, and private or cookie-setting responses are
not stored. If Next.js is unavailable and there is no valid cache entry, Nginx returns the upstream
failure rather than hiding it behind stale content.

Open-source Nginx has no application-level purge integration in this design. A normal deployment
must force-recreate every edge container, which discards its ephemeral cache and prevents HTML from
an earlier build surviving the rollout. Immediate per-URL purge and stale-while-error behavior are
outside the first version.

## Health and observability

Nginx exposes `GET /nginx-health`, returning `200` with `Cache-Control: no-store`. This checks only
the edge process. Rollout verification separately calls `web:3000/api/health` to prove the Next.js
origin and its external dependencies are healthy.

Every proxied response includes:

```text
X-Edge-Cache: HIT | MISS | BYPASS | EXPIRED
X-Edge-Replica: <container-hostname>
```

Access logs include edge cache status, upstream address, total request time, and upstream response
time. A warm `HIT` must have no origin request. The effective production configuration is inspected
with `nginx -T` during deployment acceptance.

## Repository changes

The implementation is expected to add or modify these focused areas:

- the documents-system layout and a documents-system client sidebar provider;
- component/regression tests for cookie-independent documentation rendering;
- `infra/dokploy/compose.yml` for the optional two-tier deployment;
- a pinned Nginx image, configuration, and healthcheck under `infra/dokploy/nginx/`;
- an example deployment environment file containing variable names and safe placeholders only;
- infrastructure tests and a local cache verification script;
- English and Russian public documentation describing application-level caching, the optional edge
  layer, and the standalone deployment guarantee.

The Compose definition must pass the existing Docker build arguments and BuildKit secrets required
by the root Dockerfile without committing secret values. The implementation must not print runtime
environment values, OAuth credentials, authentication secrets, database URLs, or cache passwords in
logs, tests, or reports.

## Verification

### Sidebar and rendering tests

- The server documentation layout has no `cookies()` or other request-specific dependency.
- Initial server output is closed and hydrates without a mismatch warning.
- Missing, malformed, and `false` browser cookie values remain closed.
- A `true` browser cookie opens the sidebar after hydration.
- A user toggle updates the controlled state and persists the existing cookie.
- The generic Shadcn sidebar component remains unchanged.

### Next.js origin verification

Run a production build and start the standalone output or root Docker image without Nginx. For
`/docs` and at least one nested published page:

- guest, valid authenticated-session, `sidebar_state=true`, `sidebar_state=false`, malformed-cookie,
  and safe-query requests return byte-identical complete HTML;
- the response has no `Set-Cookie`, authenticated marker, user identifier, workspace data, or other
  session-derived content;
- the response policy permits shared caching;
- `/api/health` still succeeds when the application is run directly.

Body equality is checked using the complete response bytes and a cryptographic hash, not a selected
DOM fragment.

### Local Docker edge integration

- Compose renders two `web` and two `edge` replicas without database or Dragonfly services.
- `nginx -t` succeeds and both health endpoints work.
- A documentation request produces `MISS` then `HIT` on the same edge replica.
- Safe query variants reuse the canonical pathname key; different document paths do not collide.
- Guest, authenticated, and sidebar-cookie variants return identical bodies.
- Concurrent cold requests are collapsed within one replica.
- RSC, router prefetch, Server Actions, authorization, APIs, generated images, and non-GET requests
  report `BYPASS` and cannot populate the cache.
- Redirects, 404s, 500s, `Set-Cookie`, and private/no-store/no-cache responses are not stored.
- A warm `HIT` does not reach Next.js.
- Direct traffic to `web:3000` continues to work without the edge service.

## Manual Dokploy rollout

Code and local verification are completed before any live deployment change. The first server
rollout is manual; auto-deploy is enabled only as a separate later step after edge recreation has
been proven.

1. Record the existing runtime variable names, build arguments, BuildKit secret mappings, domain,
   healthcheck, resource limits, and replica count inside Dokploy. Transfer secret values inside the
   platform without printing them in terminal output or reports.
2. Create a fresh PostgreSQL backup and verify that the backup object exists in the configured
   storage. No schema migration is required for this change.
3. Preserve the existing database URL, authentication and Server Action secrets, OAuth credentials,
   public base URL, Dragonfly/Redis connection, cache namespace, and all other required build/runtime
   settings.
4. Stop the existing Application, detach the public domain, and recreate the deployment as the
   repository Compose service with `web x2` and `edge x2`. Downtime during this controlled switch is
   acceptable.
5. Verify internal Nginx and Next.js health before routing the public domain to `edge:8080`.
6. Confirm existing users, active sessions, workspaces, and protected pages still use the existing
   external data stores and are never served from the edge cache.
7. Confirm documentation `MISS -> HIT` separately on both edge replicas, bypass behavior, warm-hit
   origin avoidance, and acceptable CPU, memory, and latency.
8. Force-recreate the edge services once more and compare container identifiers before and after.
   Every replica must start with an empty cache. Only after this proof may auto-deploy be configured
   in a follow-up operational step.

If the previous Application is retained temporarily, rollback stops Compose, restores the domain to
port `3000`, and starts that Application. If it has already been removed, rollback recreates the
standalone Application from the same image/revision and preserved settings. External PostgreSQL and
Dragonfly/Redis remain untouched in either case.

## Documentation updates

The English and Russian caching reference will distinguish:

- Cache Components and Redis/Valkey application caches;
- the optional Nginx public-response cache;
- the strict `/docs`-only HTML boundary;
- the fact that local and standalone Docker operation require no Nginx or Compose;
- deploy-time edge recreation as the invalidation mechanism.

No release note or OpenSpec change is required because the documented end-user behavior and
business capabilities do not change.

## Non-goals

- Cache the home page, authenticated pages, APIs, RSC payloads, Server Actions, or generated images.
- Extract public fragments from personalized layouts in this first change.
- Add PostgreSQL or Dragonfly/Redis to the Compose deployment.
- Make Compose or Nginx mandatory for local, Docker, Coolify, or Dokploy Application deployments.
- Add an Nginx purge API, Nginx Plus, Varnish, a CDN, or a shared edge-cache volume.
- Serve stale documentation after expiry or during origin failures.
- Change database schema, authentication, authorization, documentation content, or business flows.
- Enable auto-deploy during the first rollout.

## Acceptance criteria

The design is complete when all of the following are demonstrated:

1. The complete HTML for every cacheable documentation route is independent of request cookies,
   authentication, and safe query parameters.
2. Only canonical public `/docs` HTML and immutable Next.js assets can produce an edge `HIT`.
3. All personal, dynamic, mutation, API, RSC, prefetch, and image traffic is observably bypassed.
4. Local development and the root standalone Docker image work without Nginx or Compose.
5. The optional Compose topology runs two web and two independent edge replicas using the existing
   external data stores.
6. A deployment force-recreates every edge replica and therefore clears all old HTML.
7. The first live rollout is manual, verified, and reversible; auto-deploy remains a later explicit
   operational step.
