# End-to-End Tests

Playwright scenarios live under `e2e/`.

## Setup

Install the Chromium browser before the first local or CI run:

```bash
npm run e2e:install
```

Run the suite:

```bash
npm run e2e
```

By default Playwright starts the dev server and sets the local automation auth
environment needed by the suite. It does not reuse a server that is already
running on the configured port; stop that process or use the explicit reused
server flow below.

To reuse an already-running server, start that server with the same local-only
auth settings before running Playwright:

```bash
LOCAL_AUTOMATION_AUTH_ENABLED=true \
  AUTH_DISABLE_SESSION_COOKIE_CACHE=true \
  BETTER_AUTH_URL=http://127.0.0.1:3127 \
  NEXT_PUBLIC_APP_BASE_URL=http://127.0.0.1:3127 \
  npm run dev -- --hostname 127.0.0.1 --port 3127
```

`AUTH_DISABLE_SESSION_COOKIE_CACHE=true` must be set on the app server itself for
reused-server runs and on the Playwright command as an explicit guard:

```bash
AUTH_DISABLE_SESSION_COOKIE_CACHE=true \
  PLAYWRIGHT_START_SERVER=false \
  PLAYWRIGHT_BASE_URL=http://127.0.0.1:3127 \
  npm run e2e
```

Playwright cannot add server env to a process it did not start, and
session-revocation specs require fresh Better Auth session reads.

## Layout

- `smoke/` contains small UI smoke checks that prove the app can render and navigate.
- `specs/` contains durable requirement-backed scenarios mapped from OpenSpec capabilities.
- `support/` contains shared fixtures, routes, setup, and helpers.

## Local automation auth

Use `signInLocalAutomationUser(page)` from `e2e/support/local-auth` to create and sign in
a local Better Auth automation user in the current browser context. Use
`cleanupLocalAutomationUser(page)` in test cleanup to delete that user and any now-memberless
local organizations created during the scenario.

For OpenSpec-backed tests, mirror each capability from `openspec/specs/<capability>/spec.md`
into `e2e/specs/<capability>/`.
