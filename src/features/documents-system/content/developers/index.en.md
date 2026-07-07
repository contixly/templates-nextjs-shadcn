---
title: "For developers"
description: "How to extend a service built from the template while keeping specs, tests, and public documentation aligned."
group: "For developers"
groupOrder: 300
parentItem: "Project development"
parentItemOrder: 100
order: 10
toc: true
purpose: "Developer overview"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# For developers

This section is for teams building a service from the template. It explains the project conventions
that matter when adding product features, API routes, settings screens, or documentation.

The public user documentation remains the primary surface. Developer pages describe how to extend
the template without breaking the behavior that users rely on.

## Development model

The template follows Feature Slice Design. Application routes stay thin in `src/app`, while business
logic, schemas, repositories, actions, and feature UI live under `src/features`.

## What to keep aligned

When a visible behavior changes, update the matching surfaces together:

- OpenSpec capability under `openspec/specs`;
- implementation under `src/features` and thin routes under `src/app`;
- E2E scenarios under `e2e/specs`;
- public documentation under `src/features/documents-system/content`;
- release or weekly notes when the change is published.

## Start here

- [Feature slice architecture](/docs/developers/feature-slice)
- [Server actions](/docs/developers/server-actions)
- [Add an API v1 endpoint](/docs/developers/api-v1-endpoint)
- [OpenSpec, E2E, and docs](/docs/developers/openspec-e2e-docs)
- [Local automation and E2E](/docs/developers/local-automation-e2e)
- [Releases and changelog](/docs/developers/releases-changelog)
