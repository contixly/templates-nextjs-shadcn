# Optional Documentation Edge Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make complete `/docs` HTML independent of viewer state and add an optional, strictly allowlisted Nginx response cache for Dokploy while preserving direct local and standalone Docker operation.

**Architecture:** The documents layout renders one neutral closed-sidebar server document and a feature-owned client provider restores the existing cookie after hydration. An optional Compose topology places two independent Nginx edge replicas in front of two unchanged standalone Next.js containers; only canonical documentation HTML and hashed `/_next/static/` assets are cacheable, while all personal, API, RSC, prefetch, action, and generated-image traffic bypasses the cache.

**Tech Stack:** Next.js 16.3 App Router and Cache Components, React 19, TypeScript, Jest and Testing Library, Node.js verification scripts, Docker Compose, Nginx Alpine, Dokploy.

**Spec:** `docs/superpowers/specs/2026-09-03-docs-public-edge-cache-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/02-guides/cdn-caching.md` and `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` before editing Next.js or proxy behavior.
- Do not create or modify an OpenSpec change; this is deployment infrastructure without a changed business workflow.
- Keep `npm run dev`, `npm run start`, and the root `Dockerfile` independently usable without Nginx, Compose, Redis, or Valkey.
- Do not modify `src/components/ui/sidebar.tsx`; compose the changed behavior inside the documents-system feature.
- Cache only queryless canonical `/docs` HTML and `/_next/static/`; documentation query variants,
  the home page, and every non-allowlisted route remain bypassed.
- Always bypass APIs, generated images, RSC, router state, router prefetch, Server Actions, authorization, prefetch purpose, and methods other than `GET`/`HEAD`.
- Store only status `200` responses without `Set-Cookie`, `Vary: *`, or private/no-store/no-cache policy.
- Use a 60-minute documentation TTL, no stale-on-error, `proxy_cache_lock`, and independent ephemeral edge caches.
- Compose owns only `web x2` and `edge x2`; PostgreSQL and Dragonfly/Redis remain external and no database migration is added.
- Never commit or print secret values. Example configuration contains variable names and safe non-secret defaults only.
- The first live rollout is manual. Do not enable auto-deploy until a separate follow-up proves every edge replica is force-recreated.

---

## File Structure

### New files

- `src/features/documents-system/ui/documents-system-sidebar-provider.tsx`
  - Controlled documents sidebar provider with neutral initial state and client cookie restoration.
- `test/features/documents-system/documents-system-sidebar-provider.test.tsx`
  - Cookie parsing, post-hydration restoration, and persistence coverage.
- `test/features/documents-system/documents-system-public-layout.test.ts`
  - Regression guard that the server layout does not read request cookies.
- `infra/dokploy/nginx/Dockerfile`
  - Pinned official Nginx image that validates the repository configuration at build time.
- `infra/dokploy/nginx/nginx.conf`
  - Forward proxy, strict documentation allowlist, cache safety checks, health, and diagnostics.
- `infra/dokploy/compose.yml`
  - Optional two-edge/two-web Dokploy deployment using the root Dockerfile.
- `infra/dokploy/compose.env.example`
  - Safe list of Compose inputs without secret values.
- `test/infrastructure/dokploy-nginx-cache.test.ts`
  - Static regression tests for the Nginx security and cache boundary.
- `test/infrastructure/dokploy-compose.test.ts`
  - Static regression tests for service ownership, replicas, health, and secret wiring.
- `scripts/test/verify-docs-public-cache.mjs`
  - Complete-body origin and edge acceptance CLI with redacted output.
- `test/infrastructure/docs-public-cache-verifier.test.ts`
  - Unit tests for verifier response classification, hashing, and secret redaction.

### Modified files

- `src/app/(public)/(documents-system)/layout.tsx`
  - Remove server cookie loading and render the feature-owned client provider directly.
- `package.json`
  - Add a stable command for the public-cache verifier.
- `src/features/documents-system/content/application/caching.en.md`
  - Explain application cache versus optional public edge cache and standalone operation.
- `src/features/documents-system/content/application/caching.ru.md`
  - Russian version of the same operational contract.

---

### Task 1: Cookie-independent documentation layout

**Files:**
- Create: `src/features/documents-system/ui/documents-system-sidebar-provider.tsx`
- Create: `test/features/documents-system/documents-system-sidebar-provider.test.tsx`
- Create: `test/features/documents-system/documents-system-public-layout.test.ts`
- Modify: `src/app/(public)/(documents-system)/layout.tsx`

**Interfaces:**
- Consumes: `SidebarProvider` controlled props `open: boolean` and `onOpenChange(open: boolean): void`; `SIDEBAR_COOKIE_KEY` value `sidebar_state`.
- Produces: `parseDocumentsSidebarCookie(cookieHeader: string): boolean` and `DocumentsSystemSidebarProvider(props: React.ComponentProps<typeof SidebarProvider>): React.ReactElement`.

- [ ] **Step 1: Write failing parser and client-restoration tests**

Create tests that define a `SidebarStateProbe` through `useSidebar()` and assert the public interface:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useSidebar } from "@components/ui/sidebar";
import {
  DocumentsSystemSidebarProvider,
  parseDocumentsSidebarCookie,
} from "@features/documents-system/ui/documents-system-sidebar-provider";

jest.mock("@hooks/use-mobile", () => ({ useIsMobile: () => false }));

const SidebarStateProbe = () => {
  const { open, setOpen } = useSidebar();
  return (
    <button data-testid="sidebar-state" onClick={() => setOpen(!open)}>
      {String(open)}
    </button>
  );
};

describe("parseDocumentsSidebarCookie", () => {
  it.each([
    ["", false],
    ["sidebar_state=false", false],
    ["sidebar_state=broken", false],
    ["other=true", false],
    ["other=false; sidebar_state=true", true],
  ])("parses %s as %s", (cookieHeader, expected) => {
    expect(parseDocumentsSidebarCookie(cookieHeader)).toBe(expected);
  });
});

it("restores true after mounting and persists later toggles", async () => {
  document.cookie = "sidebar_state=true; path=/";
  render(
    <DocumentsSystemSidebarProvider>
      <SidebarStateProbe />
    </DocumentsSystemSidebarProvider>
  );

  await waitFor(() => expect(screen.getByTestId("sidebar-state")).toHaveTextContent("true"));
  screen.getByTestId("sidebar-state").click();
  expect(screen.getByTestId("sidebar-state")).toHaveTextContent("false");
  expect(document.cookie).toContain("sidebar_state=false");
});

it("renders the neutral closed state before effects run", () => {
  document.cookie = "sidebar_state=true; path=/";
  const html = renderToString(
    <DocumentsSystemSidebarProvider>
      <SidebarStateProbe />
    </DocumentsSystemSidebarProvider>
  );

  expect(html).toContain(">false</button>");
});
```

Clear `sidebar_state` before and after every test with `Max-Age=0`. Add cases for whitespace around
cookie segments and percent-encoded values; only decoded literal `true` may open the sidebar. Add a
`hydrateRoot` case that hydrates the server string with `sidebar_state=true`, waits for the state to
become open, and asserts a `console.error` spy received no hydration-mismatch message.

- [ ] **Step 2: Run the new provider test and verify RED**

Run:

```bash
npm test -- --runInBand --testPathPatterns=documents-system-sidebar-provider
```

Expected: FAIL because the provider module and exported parser do not exist.

- [ ] **Step 3: Implement the minimal feature-owned provider**

Create a client component with this state flow:

```tsx
"use client";

import * as React from "react";
import { SidebarProvider } from "@components/ui/sidebar";
import { SIDEBAR_COOKIE_KEY } from "@lib/environment";

export const parseDocumentsSidebarCookie = (cookieHeader: string): boolean => {
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SIDEBAR_COOKIE_KEY}=`))
    ?.slice(SIDEBAR_COOKIE_KEY.length + 1);

  if (value === undefined) return false;

  try {
    return JSON.parse(decodeURIComponent(value)) === true;
  } catch {
    return false;
  }
};

export function DocumentsSystemSidebarProvider(
  props: React.ComponentProps<typeof SidebarProvider>
) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(parseDocumentsSidebarCookie(document.cookie));
  }, []);

  return <SidebarProvider {...props} open={open} onOpenChange={setOpen} />;
}
```

Keep the initial state `false`; do not use a `useState` initializer that reads `document.cookie`.

- [ ] **Step 4: Make the documentation layout request-independent**

Replace the `Suspense`, `use`, `getTFromCookie`, and `SIDEBAR_COOKIE_KEY` flow with
`DocumentsSystemSidebarProvider`. `DocumentsSystemShell` no longer accepts `defaultOpen` and wraps
its content as follows:

```tsx
<DocumentsSystemSidebarProvider style={documentsSidebarStyle}>
  <DocumentsSystemSidebar menu={sidebarMenu} />
  <SidebarInset
    className="flex h-screen flex-col overflow-y-auto"
    {...{ [DOCUMENTS_SYSTEM_SCROLL_CONTAINER_ATTRIBUTE]: "" }}
  >
    <DocumentsSystemHeader />
    <div id="main-content" className="min-w-0" tabIndex={-1}>
      {children}
    </div>
  </SidebarInset>
</DocumentsSystemSidebarProvider>
```

Preserve `getLocale()`, `getCachedDocuments(locale)`, the sidebar menu, scroll-container attribute,
header, main-content id, and all current layout styling.

- [ ] **Step 5: Add the server-layout regression test and verify GREEN**

The node-environment test reads the layout and generic sidebar sources and asserts:

```ts
expect(layoutSource).toContain("DocumentsSystemSidebarProvider");
expect(layoutSource).not.toContain("getTFromCookie");
expect(layoutSource).not.toContain("SIDEBAR_COOKIE_KEY");
expect(layoutSource).not.toMatch(/from ["']next\/headers["']/u);
expect(layoutSource).not.toMatch(/\bcookies\s*\(/u);
expect(genericSidebarSource).not.toContain("parseDocumentsSidebarCookie");
```

Run:

```bash
npm test -- --runInBand --testPathPatterns='documents-system-(sidebar-provider|public-layout|sidebar)'
```

Expected: all matching suites pass without hydration warnings.

- [ ] **Step 6: Commit Task 1**

```bash
git add 'src/app/(public)/(documents-system)/layout.tsx' \
  src/features/documents-system/ui/documents-system-sidebar-provider.tsx \
  test/features/documents-system/documents-system-sidebar-provider.test.tsx \
  test/features/documents-system/documents-system-public-layout.test.ts
git commit -m "perf: make documentation html viewer independent"
```

---

### Task 2: Optional Dokploy edge and Compose topology

**Files:**
- Create: `infra/dokploy/nginx/Dockerfile`
- Create: `infra/dokploy/nginx/nginx.conf`
- Create: `infra/dokploy/compose.yml`
- Create: `infra/dokploy/compose.env.example`
- Create: `test/infrastructure/dokploy-nginx-cache.test.ts`
- Create: `test/infrastructure/dokploy-compose.test.ts`

**Interfaces:**
- Consumes: root `Dockerfile`, `web:3000/api/health`, external Dokploy network, existing build arguments and BuildKit secrets.
- Produces: `edge:8080/nginx-health`, response headers `X-Edge-Cache` and `X-Edge-Replica`, services `edge` and `web` with two replicas each.

- [ ] **Step 1: Write failing Nginx boundary tests**

Create a node-environment source test patterned after the donor infrastructure test. It must extract
all location blocks containing `proxy_cache public_pages;` and assert that the only cacheable route
families are exactly:

```ts
expect(cachedLocations).toEqual([
  "location = /docs",
  "location ~ ^/docs/(.+)$",
  "location ^~ /_next/static/",
]);
```

Also assert the configuration contains maps for request method, `Authorization`, `RSC`,
`Next-Router-State-Tree`, `Next-Router-Prefetch`, `Next-Router-Segment-Prefetch`, `Next-Action`,
`Purpose|Sec-Purpose`, and `.rsc`/`.segment.rsc` paths. Assert the cacheable documentation block has:

```text
proxy_cache_key "$forwarded_proto|$host|$uri";
proxy_cache_valid 200 60m;
proxy_cache_lock on;
proxy_cache_bypass $skip_request_cache;
proxy_no_cache $skip_request_cache;
proxy_no_cache $skip_private_response;
proxy_no_cache $upstream_http_set_cookie;
```

Assert explicit proxy-only generated-image locations for `/docs/og/`, `/docs/opengraph-image`, and
`/docs/twitter-image`, a proxy-only fallback `location /`, no `proxy_cache_use_stale`, dynamic Docker
DNS at `127.0.0.11`, a bounded 512 MiB cache, and one worker process.

- [ ] **Step 2: Write failing Compose topology tests**

The source test must assert:

```ts
expect(compose).toMatch(/edge:[\s\S]*?replicas:\s*2/u);
expect(compose).toMatch(/web:[\s\S]*?replicas:\s*2/u);
expect(compose).toContain("dockerfile: Dockerfile");
expect(compose).toContain("dockerfile: infra/dokploy/nginx/Dockerfile");
expect(compose).toContain("http://127.0.0.1:3000/api/health");
expect(compose).toContain("http://127.0.0.1:8080/nginx-health");
expect(compose).not.toMatch(/^\s{2}(postgres|dragonfly|redis|valkey):/mu);
expect(compose).not.toMatch(/\/var\/cache\/nginx\/public:/u);
```

Assert `DATABASE_URL`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, public base URL,
OAuth credentials, Redis/Valkey settings, cache prefix, locale, and deployment id are mapped without
literal production values. Assert the external `dokploy-network` and that only port `8080` is exposed
by `edge`; `web` exposes only port `3000` to the private network.

- [ ] **Step 3: Run both infrastructure tests and verify RED**

```bash
npm test -- --runInBand --testPathPatterns='dokploy-(nginx-cache|compose)'
```

Expected: FAIL because the Nginx and Compose files do not exist.

- [ ] **Step 4: Add the pinned Nginx image and strict proxy configuration**

Use the donor's pinned `nginx:1.30.4-alpine` digest unless `docker build` proves it unavailable.
The Dockerfile copies `infra/dokploy/nginx/nginx.conf`, runs `nginx -t`, exposes `8080`, uses
`STOPSIGNAL SIGQUIT`, and starts Nginx in the foreground.

In `nginx.conf`:

- preserve `Host`, forwarded host/proto/port, and append `X-Forwarded-For` consistently in every
  proxying location;
- resolve `http://web:3000` dynamically through Docker DNS;
- disable upstream compression and gzip safe text formats at Nginx;
- define request and response safety maps before the server block;
- place explicit generated-image bypass locations before the documentation regex;
- use exact `/docs` and nested `/docs/(.+)` cached locations, with the nested block declining
  generated images through the explicit higher-priority locations and request bypass map;
- give fallback responses `X-Edge-Cache: BYPASS` and every proxied response an edge replica header;
- return `ok\n` from `/nginx-health` with `Cache-Control: no-store`;
- never serve stale cache entries.

Do not cache `/`, `/api/health`, optimized `/_next/image`, public files, or any authenticated route.

- [ ] **Step 5: Add the optional Compose deployment and safe input example**

Create a Compose project named `nextjs-shadcn` with only `edge` and `web`. The `web` build uses
context `../..`, root `Dockerfile`, build args for `DATABASE_URL`, public variables, and deployment
id, plus environment-backed BuildKit secrets for the four secret mounts already named by the
Dockerfile. Runtime environment uses required interpolation for database/auth/public base values and
optional empty/default interpolation for provider credentials and Redis/Valkey settings.

Use Node for the web healthcheck so the root image needs no added package:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "node",
      "-e",
      "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))",
    ]
```

The edge healthcheck uses Alpine `wget`. Both services attach to the existing external
`dokploy-network`. Do not publish host ports or declare persistent volumes.

`infra/dokploy/compose.env.example` lists every interpolation key once, groups build/runtime/cache/
OAuth values, uses `https://example.com` for the public URL, and uses conspicuous invalid values such
as `replace-with-a-secret` and `database.invalid` where Compose interpolation requires a non-empty
value. The file contains no usable credential.

- [ ] **Step 6: Verify the infrastructure files**

```bash
npm test -- --runInBand --testPathPatterns='dokploy-(nginx-cache|compose)'
docker build --progress=plain -f infra/dokploy/nginx/Dockerfile -t nextjs-shadcn-edge:test .
docker run --rm nextjs-shadcn-edge:test nginx -t
docker compose --env-file infra/dokploy/compose.env.example -f infra/dokploy/compose.yml config --quiet
```

Expected: Jest passes, the image builds, `nginx -t` succeeds, and Compose renders without defining a
database or cache container. The example values validate configuration shape only; actual
application startup uses the operator's preserved values.

- [ ] **Step 7: Commit Task 2**

```bash
git add infra/dokploy test/infrastructure/dokploy-nginx-cache.test.ts \
  test/infrastructure/dokploy-compose.test.ts
git commit -m "feat: add optional documentation edge cache"
```

---

### Task 3: Complete-body public cache verifier

**Files:**
- Create: `scripts/test/verify-docs-public-cache.mjs`
- Create: `test/infrastructure/docs-public-cache-verifier.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes environment variables: `ORIGIN_BASE_URL`, `EDGE_BASE_URL`, `AUTH_COOKIE`, optional `DOCS_PATHS` comma list, `EDGE_REPLICA_COUNT` default `2`, and `MAX_EDGE_REQUESTS` default `80`.
- Produces JSON on stdout containing only pass/fail metadata, SHA-256 hashes, byte counts, path counts, and observed replica ids; never emits the auth cookie or response bodies.

- [ ] **Step 1: Write failing helper tests**

Import the `.mjs` module from a node-environment Jest test and assert:

```ts
expect(sha256(Buffer.from("docs"))).toMatch(/^[a-f0-9]{64}$/u);
expect(classifyPublicResponse({ status: 200, cacheControl: "public, s-maxage=3600", setCookie: null })).toEqual({ ok: true });
expect(classifyPublicResponse({ status: 200, cacheControl: "private, no-store", setCookie: null })).toMatchObject({ ok: false });
expect(classifyPublicResponse({ status: 200, cacheControl: "public", setCookie: "session=x" })).toMatchObject({ ok: false });
expect(redactError(new Error("Cookie: super-secret"), "super-secret")).not.toContain("super-secret");
```

Also assert invalid replica counts and empty required URLs throw before any fetch, and importing the
module does not execute the CLI.

- [ ] **Step 2: Run the verifier unit test and verify RED**

```bash
npm test -- --runInBand --testPathPatterns=docs-public-cache-verifier
```

Expected: FAIL because the verifier module does not exist.

- [ ] **Step 3: Implement reusable checks and the CLI guard**

Export `sha256(body)` using
`createHash("sha256").update(body).digest("hex")`; `classifyPublicResponse({ status, cacheControl,
setCookie })` returning `{ ok: true }` or `{ ok: false, reason: string }`; `parseVerifierConfig(env =
process.env)` returning validated URLs, paths, replica limits, and the auth cookie;
`redactError(error, secret)` returning a safe string; and async `runVerification(config, fetchImpl =
fetch)` returning the JSON-safe result object.

Execute `runVerification(parseVerifierConfig())` only when `import.meta.url` equals the file URL for
`process.argv[1]`. Use `Buffer.from(await response.arrayBuffer())` and compare full bytes plus SHA-256.

The verification sequence must:

1. fetch `/docs` and one nested page at the origin as guest, with `sidebar_state=true`, with
   `sidebar_state=false`, with malformed sidebar state, and with `AUTH_COOKIE`;
2. require `200`, no `Set-Cookie`, no private/no-store/no-cache, identical bytes, and no configured
   auth-cookie value in the body;
3. warm every expected edge replica and prove a subsequent request on each is `HIT` with identical
   bytes;
4. prove auth variants reuse the warmed object on the same replica and query variants report
   `BYPASS`;
5. require `BYPASS` for `/api/health`, `/docs/og/index`, RSC, router-state, router-prefetch,
   router-segment-prefetch, Server Action, authorization, and `POST` probes;
6. print one JSON result and never print cookies or bodies, including in thrown errors.

Use `redirect: "manual"` so redirects cannot be mistaken for public documents.

- [ ] **Step 4: Add the npm command and verify GREEN**

Add without changing existing scripts:

```json
"test:public-cache": "node scripts/test/verify-docs-public-cache.mjs"
```

Run:

```bash
npm test -- --runInBand --testPathPatterns=docs-public-cache-verifier
node scripts/test/verify-docs-public-cache.mjs 2>&1 | grep -q 'ORIGIN_BASE_URL'
```

Expected: Jest passes; the direct command fails safely with a missing-variable message and contains
no environment values.

- [ ] **Step 5: Commit Task 3**

```bash
git add package.json scripts/test/verify-docs-public-cache.mjs \
  test/infrastructure/docs-public-cache-verifier.test.ts
git commit -m "test: verify public documentation cache safety"
```

---

### Task 4: Public deployment and caching documentation

**Files:**
- Modify: `src/features/documents-system/content/application/caching.en.md`
- Modify: `src/features/documents-system/content/application/caching.ru.md`

**Interfaces:**
- Consumes: optional topology and verifier command from Tasks 2 and 3.
- Produces: equivalent English and Russian operator guidance at the existing canonical caching page.

- [ ] **Step 1: Add failing documentation assertions**

Extend `test/features/documents-system/documents-system.test.ts` or add a focused node test that reads
both files and requires these literal commands/paths in each language:

```text
infra/dokploy/compose.yml
npm run test:public-cache
/docs
/_next/static/
/nginx-health
/api/health
```

Assert both files state that Nginx and Compose are optional and that deployment recreates ephemeral
edge caches. Do not assert translated prose word-for-word beyond stable technical terms.

- [ ] **Step 2: Run the documentation test and verify RED**

```bash
npm test -- --runInBand --testPathPatterns=documents-system
```

Expected: the new assertions fail because the edge-cache guidance is absent.

- [ ] **Step 3: Update English and Russian caching references**

Keep existing frontmatter and application-cache sections. Add parallel sections covering:

- Cache Components/Redis/Valkey versus the optional full-response edge cache;
- local and root-Docker commands working without Nginx;
- the `/docs` and `/_next/static/` positive allowlist and all-private-route bypass rule;
- `X-Edge-Cache`, `X-Edge-Replica`, both health endpoints, and the verifier command;
- 60-minute TTL, no stale-on-error, and force-recreate invalidation;
- manual first rollout and delayed auto-deploy.

Use plain product-facing language and do not include production credentials, internal IDs, or
Dokploy screenshots.

- [ ] **Step 4: Verify documentation content and links**

```bash
npm test -- --runInBand --testPathPatterns=documents-system
npm run build
```

Expected: document registry/link tests and the production build pass; `/docs/application/caching`
is generated for both supported locales.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/features/documents-system/content/application/caching.en.md \
  src/features/documents-system/content/application/caching.ru.md \
  test/features/documents-system/documents-system.test.ts
git commit -m "docs: explain optional public edge caching"
```

If the documentation assertion lives in a new focused test, stage that exact file instead of an
unchanged `documents-system.test.ts`.

---

### Task 5: Integrated local acceptance

**Files:**
- Inspect all files changed by Tasks 1-4.
- Modify only the smallest covered file when a concrete acceptance failure is reproduced.

**Interfaces:**
- Consumes: complete implementation from Tasks 1-4 and local non-production credentials from the
  existing developer environment without logging their values.
- Produces: recorded command evidence that direct Next.js, root Docker, and optional edge operation
  meet the approved design.

- [ ] **Step 1: Run static repository verification**

```bash
npm run lint
npm test -- --runInBand
npm run build
git diff --check
```

Expected: ESLint has no errors, Jest is green, the production build succeeds, and the diff has no
whitespace errors. An existing warning is reported separately and not described as a new failure.

- [ ] **Step 2: Verify direct local operation without Nginx**

Start the application directly with the local environment, request `/api/health`, `/docs`, and one
nested document, then stop it. No Nginx or Compose process may be running for this check.

Expected: all requests return `200`; documentation navigation and sidebar toggling work. With
`sidebar_state=true`, the fetched server HTML remains the neutral closed document and the browser
opens it only after hydration.

- [ ] **Step 3: Verify the root standalone Docker image**

Build the unchanged root image with the existing safe local build-variable mechanism, start it on an
unused loopback port, and call `/api/health` and `/docs` directly. Pass secrets through environment or
BuildKit secret files, never command-line literals captured in the report.

Expected: the root image starts and serves directly without Nginx, proving Compose is optional.

- [ ] **Step 4: Verify Nginx against the real local application**

Before starting the production topology, run the development server with
`LOCAL_AUTOMATION_AUTH_ENABLED=true` and `AUTH_DISABLE_SESSION_COOKIE_CACHE=true`, create a disposable
local automation user, and save its cookie jar to a mode-`0600` file outside the repository. Stop the
development server, then start the production topology with the same database and
`BETTER_AUTH_SECRET`. Send the saved session token as an explicit `Cookie` header so the verifier
tests a valid authenticated session against production-rendered HTML. Never store the cookie in
shell history, process arguments, files under Git, or captured logs.

Run the verifier from a disposable Node container attached to `dokploy-network`, using
`http://web:3000` for the origin. Resolve each edge container's private address with `docker inspect`
and run the verifier once per edge replica with `EDGE_REPLICA_COUNT=1`; this avoids publishing ports
and proves both independent caches. Run:

```bash
docker run --rm --network dokploy-network \
  --env-file /tmp/docs-cache-verifier.env \
  -v "$PWD/scripts/test:/checks:ro" \
  node:24-alpine node /checks/verify-docs-public-cache.mjs
```

Create `/tmp/docs-cache-verifier.env` with mode `0600`; set `ORIGIN_BASE_URL=http://web:3000`, one
private `EDGE_BASE_URL`, `EDGE_REPLICA_COUNT=1`, and `AUTH_COOKIE`, then delete the verifier file
immediately after both runs. Do not echo either temporary file. After production verification, start
the development server with local automation enabled again, delete the disposable user through the
existing cleanup endpoint using the cookie jar, stop the server, and delete the cookie jar.

Expected: JSON reports complete-body equality for cacheable variants, both replicas warmed, query
variants bypassed, and successful bypass probes. Confirm a warm `HIT` does not add an origin
access-log entry.

- [ ] **Step 5: Prove ephemeral invalidation and independent replicas**

Record only container identifiers and cache headers, force-recreate both edge replicas, and verify
that each previously warm documentation path returns `MISS` before returning `HIT` again. Confirm no
named or shared edge cache volume exists.

- [ ] **Step 6: Review the final branch and commit acceptance-only fixes**

If Steps 1-5 required a code or configuration correction, first add a regression test that fails for
that concrete issue, then apply the minimum fix, rerun its focused checks, and commit using the
appropriate `fix:`, `test:`, or `docs:` conventional prefix. If no file changed, do not create an
empty commit.

Record the final commands, exit statuses, route/cache results, and any intentionally deferred live
valid-session check in the subagent report without including environment values or response bodies.

---

## Live rollout boundary

Implementation completion does not itself authorize a production deployment. The subsequent manual
Dokploy operation must preserve all environment/build settings, verify a fresh external PostgreSQL
backup, stop the existing Application, move the domain to `edge:8080`, verify existing personal data
and sessions, exercise the verifier, and prove force-recreation. Auto-deploy remains disabled until a
separate explicitly approved follow-up.
