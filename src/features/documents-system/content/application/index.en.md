---
title: "Application shell"
description: "Public entry points, protected application shell, dashboard surface, and feature extension points."
group: "Application"
groupOrder: 500
parentItem: "Foundation"
parentItemOrder: 100
order: 10
toc: true
purpose: "Application overview"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Application shell

The template ships with public routes, protected routes, a shared application shell, and a starter
dashboard. These surfaces are meant to be replaced or extended by the product built from the
template.

## Public routes

Public routes include the homepage, login/error pages, documentation, auth endpoints, health checks,
and `/api/v1`. Public does not mean unauthenticated data access: API v1 still requires API key
authentication.

## Protected routes

Protected application pages live behind Better Auth session checks. The route boundary is enforced
before protected content renders.

The global protected routes include:

- `/dashboard`;
- `/welcome`;
- `/workspaces`;
- `/user/...`;
- `/invite/:invitationId`;
- `/w/:organizationKey/...`.

## Dashboard surface

The starter dashboard is a template page. It demonstrates the protected layout, workspace route
context, loading skeletons, and shared UI primitives. Replace the demo content with product-specific
overview data when building a service from the template.

## Extension points

Use the existing feature slices as the default pattern for adding product capabilities:

- define routes in the feature route file;
- keep pages and layouts thin in `src/app`;
- keep business logic under `src/features`;
- use shared UI primitives from `src/components`.

## Related pages

- [Quick start](/docs/general/quick-start)
- [Workspace](/docs/workspace)
- [Feature slice architecture](/docs/developers/feature-slice)
