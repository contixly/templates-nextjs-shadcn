---
title: "Feature slice architecture"
description: "Where to place routes, actions, schemas, repositories, UI, and messages when adding a feature."
group: "For developers"
groupOrder: 300
parentItem: "Project development"
parentItemOrder: 100
order: 20
toc: true
purpose: "Developer how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Feature slice architecture

Use a feature slice for each product capability. The goal is to keep business behavior close to the
feature that owns it while keeping route files thin.

## Default file layout

Feature code lives under `src/features/{feature-name}`:

| File or folder | Purpose |
| -------------- | ------- |
| `actions/` | Server actions for mutations. |
| `components/` | Feature-specific UI components. |
| `{feature}-repository.ts` | Data access and cached reads. |
| `{feature}-types.ts` | Types, DTOs, and cache tag helpers. |
| `{feature}-schemas.ts` | Zod validation schemas. |
| `{feature}-routes.ts` | Route definitions owned by the feature. |
| `{feature}-logger.ts` | Structured logger child for the feature. |

`src/app` should contain only pages, layouts, and route handlers that delegate to feature modules.

## Dependency direction

Feature slices may depend on shared libraries and shared UI. They should not depend on other
features directly. When two features need shared behavior, move the behavior to `src/lib`,
`src/server`, or a shared component boundary.

## Messages and metadata

User-facing text belongs in `src/messages` and should be added for both supported locales. Route
metadata should use the existing page metadata helpers instead of hard-coded strings in page files.

## Public documentation

When a feature changes user-visible behavior, update or add the matching public documentation page.
Use [OpenSpec, E2E, and docs](/docs/developers/openspec-e2e-docs) as the cross-surface checklist.

## Related pages

- [Server actions](/docs/developers/server-actions)
- [Application shell](/docs/application)
- [How to write documentation](/docs/general/authoring/how-to-write-docs)
