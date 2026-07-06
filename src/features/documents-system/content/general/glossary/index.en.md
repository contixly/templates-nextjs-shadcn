---
title: "Glossary"
description: "Definitions for the main Next.js template, workspace, API access, and documentation terms."
group: "General"
parentItem: "Glossary"
parentItemOrder: 10
order: 10
toc: true
purpose: "Template user documentation"
status: "published"
author: "Template Maintainers"
version: "1.1.0"
editedAt: "2026-07-06"
---

# Glossary

This glossary defines terms used by the template and its documentation. It is not a product-domain
dictionary: after creating your own application, you can extend or replace it with terms from your
domain.

## Application and routing

| Term | Meaning |
| ---- | ------- |
| Template | The starter Next.js project with auth, workspaces, localization, API keys, documentation, and quality checks. |
| App Router | Next.js routing where pages, layouts, and route handlers live under `src/app`. |
| Public route | A route that can be opened without signing in, such as `/`, `/auth/login`, `/docs`, or `/api/v1`. |
| Protected route | A route that requires a valid Better Auth session. |
| Proxy | `src/proxy.ts`, which checks the public/protected route boundary before a page renders. |
| Feature Slice | The project structure where business logic for a feature lives under `src/features/{feature}`. |
| Server action | A server-side mutation that validates input, checks access, changes data, and refreshes cache state. |
| Application shell | The protected layout and navigation structure used by signed-in application pages. |
| Dashboard | The starter protected overview page that demonstrates the shell and should be replaced with product-specific content. |

## Accounts and authentication

| Term | Meaning |
| ---- | ------- |
| Better Auth | The auth library used for users, sessions, OAuth providers, organizations, teams, and API keys. |
| Session | A confirmed sign-in for a user. Sessions allow protected routes and server actions to identify the actor. |
| OAuth provider | An external sign-in provider such as Google, GitHub, GitLab, VK, or Yandex. Only fully configured providers appear in the UI. |
| Connected account | A link between the current user and an OAuth provider on the account settings page. |
| Local automation auth | A local-only mode for Playwright and browser automation. It creates temporary users outside production only when explicitly enabled. |
| Danger zone | The account section for destructive actions such as deleting the current user account. |

## Workspaces

| Term | Meaning |
| ---- | ------- |
| Workspace | The user-facing name for an application workspace. In the template, a workspace is backed by a Better Auth Organization. |
| Organization | The Better Auth model that stores workspace members, roles, teams, invitations, and API keys. |
| Organization key | The URL segment in `/w/:organizationKey/...`. It can be an organization slug or id. |
| Active workspace | The workspace selected in the user's current session. `/dashboard` redirects to it or to a deterministic fallback. |
| Member | A user who belongs to a workspace and has one of the built-in roles. |
| Role | A set of member permissions. The template includes owner, admin, and member. |
| Invitation | A request to join a workspace. Invitees can accept or reject it after signing in. |
| Team | An explicit subgroup inside a workspace. New workspaces do not create an automatic team; zero teams is a valid state. |
| Team-targeted invitation | An invitation that joins the accepted user to the workspace and to one selected team. |
| Allowed email domains | A workspace setting that allows invitations only for configured email domains and warns about existing out-of-policy members. |
| Zero-workspace onboarding | The experience shown to users with no accessible workspaces. It keeps workspace creation and personal invitation review available. |
| Workspace settings | Dedicated section pages for workspace details, users, invitations, teams, roles, and workspace API keys. |

## API and integrations

| Term | Meaning |
| ---- | ------- |
| API key | A key for machine access to `/api/v1`. Browser cookies are not accepted for these routes. |
| API v1 | The starter external API surface authenticated by API keys and returned through stable JSON envelopes. |
| Personal API key | A user-owned key. It acts as the owner and can read workspace data only while that user remains a workspace member. |
| Organization API key | A workspace-owned key. It acts as one organization and is managed from workspace settings. |
| Permission preset | A reusable group of API key scopes. Product teams can extend presets with their own permissions. |
| Scope | A concrete API key permission checked before a route handler returns data. |
| Rate limit | A request-frequency limit applied to an API key. |
| JSON envelope | The common API response shape: `{ data: ... }` for success and `{ error: { code, message } }` for handled errors. |

## Localization, cache, and documentation

| Term | Meaning |
| ---- | ------- |
| `PUBLIC_DEFAULT_LOCALE` | The environment variable that sets the default app and documentation locale. If unsupported, the template falls back to `en`. |
| Locale variant | A documentation file with a locale suffix, such as `index.en.md` or `index.ru.md`. |
| Fallback language marker | The documentation UI marker shown when the page content is not available in the selected interface locale. |
| Cache Components | The Next.js caching mode used by the template for server rendering and cached data access. |
| Remote cache | Optional Redis/Valkey storage for Cache Components and ISR, enabled with `REMOTE_CACHING_ENABLED=true`. |
| OpenSpec | Requirements under `openspec/specs` that describe user-visible behavior and drive E2E coverage. |
| OpenSpec-backed E2E | Playwright scenarios under `e2e/specs/<capability>` that mirror an OpenSpec capability. |
| Settings shell | The shared layout pattern used by account and workspace settings pages. |

## Related pages

- [Template documentation](/docs) - overview of the available sections.
- [Quick start](/docs/general/quick-start) - first local setup flow.
- [Workspace](/docs/workspace) - workspace model and user-facing flows.
- [API access](/docs/api) - API keys and `/api/v1`.
- [For developers](/docs/developers) - extension workflow for teams using the template.
- [Releases](/docs/history/releases) - published change history.
