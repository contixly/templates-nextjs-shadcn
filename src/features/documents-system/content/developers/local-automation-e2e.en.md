---
title: "Local automation and E2E"
description: "Use local automation auth and Playwright helpers to verify protected browser and API workflows."
group: "For developers"
groupOrder: 300
parentItem: "Quality workflow"
parentItemOrder: 70
order: 20
toc: true
purpose: "Developer testing how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Local automation and E2E

The template includes a local-only Better Auth automation flow for Playwright and browser
automation. It creates temporary signed-in users without enabling unsafe production shortcuts.

## Enable local automation

Set `LOCAL_AUTOMATION_AUTH_ENABLED=true` only in local development. For tests that depend on fresh
session reads, also set `AUTH_DISABLE_SESSION_COOKIE_CACHE=true`.

Do not enable local automation auth in production.

## Create an automation user

E2E tests should prefer `signInLocalAutomationUser(page)` from `e2e/support/local-auth`. The helper
creates a local automation user, signs in through the same browser context, and returns scenario
data for the test.

Automation users use the `local-agent+...@local-agent.test` email namespace.

## Clean up

Use `cleanupLocalAutomationUser(page)` from the same authenticated browser context. Cleanup refuses
non-automation users and removes now-memberless local organizations created by the scenario.

## Run E2E

`npm run e2e` starts its own dev server on the configured Playwright base URL by default. Use
`PLAYWRIGHT_START_SERVER=false` only when intentionally testing against an already running app with
matching local automation settings.

## Related pages

- [OpenSpec, E2E, and docs](/docs/developers/openspec-e2e-docs)
- [Account settings](/docs/account)
- [Workspace](/docs/workspace)
