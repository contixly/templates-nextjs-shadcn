---
title: "OpenSpec, E2E, and docs"
description: "Keep requirements, browser/API checks, and public documentation aligned when behavior changes."
group: "For developers"
groupOrder: 300
parentItem: "Quality workflow"
parentItemOrder: 70
order: 10
toc: true
purpose: "Developer workflow reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# OpenSpec, E2E, and docs

Feature work in this template should keep requirements, implementation, checks, and public
documentation aligned. This prevents the template from shipping behavior that only exists in code.

## Before implementation

Find the closest capability under `openspec/specs`. If no capability exists and the change is
visible to users or API clients, create or update the OpenSpec coverage before implementation.

## During implementation

Use the spec to drive the feature boundary. Keep implementation inside the owning feature slice and
avoid pulling unrelated behavior into the change.

## E2E coverage

OpenSpec-backed E2E tests live under `e2e/specs/<capability>`. Quick reachability checks belong in
`e2e/smoke`.

Use shared helpers from `e2e/support` for auth, routes, workspaces, invitations, and API keys.

## Public documentation

When the user-visible behavior changes, update the closest public documentation page. Add both
`.en.md` and `.ru.md` variants when the page is public.

## Verification

Run focused checks while iterating and the relevant broader checks before completion. For
documentation-only changes, run the documents-system content tests and formatting checks.

## Related pages

- [Local automation and E2E](/docs/developers/local-automation-e2e)
- [How to write documentation](/docs/general/authoring/how-to-write-docs)
- [Releases and changelog](/docs/developers/releases-changelog)
