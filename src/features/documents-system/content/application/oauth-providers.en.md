---
title: "OAuth providers"
description: "Configure provider credentials and understand how configured-only login and connection UI works."
group: "Application"
groupOrder: 500
parentItem: "Authentication"
parentItemOrder: 80
order: 10
toc: true
purpose: "Authentication how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# OAuth providers

The template uses Better Auth for authentication and supports several OAuth providers. Providers are
registered only when their required environment variables are present.

## Supported providers

| Provider | Environment variables |
| -------- | --------------------- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| GitLab | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET` |
| VK | `VK_CLIENT_ID` |
| Yandex | `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` |

Configure only the providers your service will use. Missing provider values keep that provider out
of login, navigation, and account connection UI.

## Redirect URLs

Provider dashboards must use redirect URLs that match the Better Auth callback for your application
origin. Keep `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_BASE_URL` aligned with how users open the app.

## Account connections

Users manage provider connections from `/user/connections`. The UI lists configured providers,
supports linking missing connections, and prevents unsafe unlinking when it would leave the account
without a reliable sign-in method.

## Related pages

- [Profile and connections](/docs/account/profile-connections)
- [Quick start](/docs/general/quick-start)
- [Runtime security](/docs/application/runtime-security)
