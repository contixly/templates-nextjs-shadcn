# Playwright E2E and MCP Design

Date: 2026-05-01
Status: Approved for planning

## Context

The project is a Next.js 16 application with App Router, Cache Components, Better Auth, Prisma, and OpenSpec
requirements stored under `openspec/specs/*/spec.md`. Browser automation is already part of the repository's local
workflow through the local-only Better Auth automation endpoint:

- `POST /api/local-auth/scenario` creates and authenticates a local automation user.
- `DELETE /api/local-auth/scenario` cleans up the current local automation user and memberless local organizations.

The repository already has `next-devtools-mcp` installed and `.agents/mcp/mcp.json` configured for `next-devtools` and
`chrome-devtools`. It does not yet have Playwright's test runner, a project-level Playwright config, or an `e2e/` test
tree.

The relevant local Next.js documentation was checked before design work:

- `node_modules/next/dist/docs/01-app/02-guides/mcp.md`
- `node_modules/next/dist/docs/01-app/02-guides/local-development.md`

## Goals

- Add project-level Playwright end-to-end testing with tests stored under `e2e/`.
- Add Playwright MCP configuration alongside the existing Next.js MCP server configuration.
- Establish a folder structure that can scale from smoke tests to OpenSpec-backed requirement tests.
- Add a first UI smoke test that runs against the public application without requiring database fixtures.
- Keep authenticated flows prepared for later tests through the existing local automation auth endpoint.

## Non-Goals

- Do not add a full CI workflow in the first setup.
- Do not write broad authenticated workspace coverage in the first smoke test.
- Do not change application behavior or production runtime configuration.
- Do not replace existing Jest unit/integration tests.

## Decision Summary

Use two complementary layers:

1. `@playwright/test` for project-owned end-to-end test files, config, reports, and local/CI execution.
2. `@playwright/mcp` in `.agents/mcp/mcp.json` for agent-driven browser control through Model Context Protocol.

The E2E tree will be requirement-oriented rather than page-oriented. Smoke tests get their own fast lane, while future
OpenSpec-backed tests will be grouped by OpenSpec capability name.

## Approaches Considered

### Recommended: Spec-first E2E Structure

Structure tests around `e2e/smoke/`, `e2e/specs/<openspec-capability>/`, and shared helpers in `e2e/support/`.

This keeps the first setup small while giving future tests a direct mapping to OpenSpec requirements. It also avoids
mixing low-level helpers, smoke checks, and feature scenarios in one folder.

### Alternative: Page-first Structure

Group tests by application area, such as `e2e/pages/auth/`, `e2e/pages/workspaces/`, and `e2e/pages/settings/`.

This is familiar and easy to browse, but it weakens the connection between tests and OpenSpec requirements. As the
suite grows, requirement coverage becomes harder to audit.

### Alternative: Flat Smoke-only Start

Add only a single `e2e/app.smoke.spec.ts` test and defer structure.

This is fastest initially, but it creates churn once requirement-backed tests begin. The project already knows OpenSpec
will become the test source of truth, so a small amount of structure is justified now.

## Test Tree

```text
e2e/
  README.md
  smoke/
    app-ui.smoke.spec.ts
  specs/
    README.md
  support/
    routes.ts
    test.ts
```

### `e2e/smoke/`

Fast checks that verify the app is reachable and core UI surfaces do not fail catastrophically. These tests should stay
small and stable.

The first smoke test will:

- Open the public home page at `/`.
- Fail on uncaught page errors and failed first-party network responses.
- Assert that public UI content is visible.
- Navigate to `/auth/login` through the visible login CTA.
- Assert that the login page renders.

The test intentionally avoids authenticated state. That keeps the first setup independent of local database state while
still exercising real browser rendering.

### `e2e/specs/`

Future requirement tests live under folders named after OpenSpec capability directories:

```text
e2e/specs/account-session-management/
e2e/specs/workspace-onboarding-guard/
e2e/specs/workspace-settings-navigation/
```

Each folder should map tests to scenarios from the matching `openspec/specs/<capability>/spec.md`. The root
`e2e/README.md` documents setup and folder roles; `e2e/specs/README.md` documents the OpenSpec mapping and expected
scenario naming pattern.

### `e2e/support/`

Shared Playwright helpers live here:

- `test.ts` exports the project's Playwright `test` and `expect`, plus shared behavior such as console/page-error
  collection when useful.
- `routes.ts` centralizes stable route constants used by tests.

Authenticated helper fixtures can be added later. They should use the existing local automation endpoint from the same
browser/API context and clean up with `DELETE /api/local-auth/scenario`.

## Playwright Configuration

Add `playwright.config.ts` at the repository root with:

- `testDir: "./e2e"`
- `baseURL` from `PLAYWRIGHT_BASE_URL`, defaulting to `http://127.0.0.1:3127`
- `webServer` running `npm run dev` against the local dev server
- `reuseExistingServer` outside CI
- traces retained on retry or first failure
- screenshots on failure
- video retained on failure
- one initial browser project: Chromium desktop

Chromium-only is enough for the first setup. Firefox and WebKit can be added after the suite has stable requirement
coverage.

## Package Scripts and Dependencies

Add dev dependencies:

- `@playwright/test`
- `@playwright/mcp`

Add scripts:

```json
{
  "e2e": "playwright test",
  "e2e:install": "playwright install chromium",
  "e2e:headed": "playwright test --headed",
  "e2e:ui": "playwright test --ui",
  "e2e:report": "playwright show-report"
}
```

The existing `npm run test` remains Jest-only. Playwright is deliberately exposed as a separate E2E command.
Jest must ignore `e2e/` so Playwright specs and support files are not collected by the unit/integration runner.

## MCP Configuration

Extend `.agents/mcp/mcp.json` with a Playwright server while preserving the existing servers:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

`next-devtools` remains the source for Next.js runtime context. Playwright MCP is for browser control and visual
verification. The project-owned `@playwright/test` suite remains the durable regression test layer.

## OpenSpec Mapping

OpenSpec becomes the source of requirement intent for future E2E scenarios. The convention is:

- OpenSpec capability: `openspec/specs/<capability>/spec.md`
- E2E folder: `e2e/specs/<capability>/`
- Test title references the requirement/scenario in readable form

Example:

```text
openspec/specs/workspace-onboarding-guard/spec.md
e2e/specs/workspace-onboarding-guard/zero-workspace-user.spec.ts
```

This makes it possible to audit coverage by comparing `openspec/specs/` with `e2e/specs/`.

## Error Handling and Diagnostics

Tests should fail early on:

- uncaught page errors
- failed first-party responses with status code `>= 500`
- missing expected UI landmarks or text

Generated Playwright artifacts should stay in Playwright's configured output/report folders. Ad hoc browser artifacts
created by agents should continue to use `output/playwright/` per repository guidance.

## Verification

After implementation, verify with:

```bash
npm run e2e
npm run lint
```

If the dev server cannot start because local environment variables or PostgreSQL are unavailable, report that clearly
and run the strongest available static verification instead.
