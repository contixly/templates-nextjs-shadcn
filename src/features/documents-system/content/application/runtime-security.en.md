---
title: "Runtime security"
description: "Security-relevant runtime defaults for app origin, image hosts, browser headers, and protected routes."
group: "Application"
groupOrder: 500
parentItem: "Runtime"
parentItemOrder: 90
order: 10
toc: true
purpose: "Runtime security reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Runtime security

The template includes baseline runtime safeguards that should stay visible when the service is
adapted for production.

## Public application URL

Production deployments require a configured public base URL. Keep `BETTER_AUTH_URL`,
`NEXT_PUBLIC_APP_BASE_URL`, and any deployment-domain logic aligned with the real domain users open
in the browser.

## Remote images

Image optimization uses a strict remote host policy. Add only the image hosts that the product
needs. Do not allow arbitrary remote image domains.

## Browser headers

The application sets baseline browser security headers globally. Review them before adding embeds,
iframes, or third-party scripts so product requirements do not weaken the default protection
silently.

## Route protection

Protected pages require a valid Better Auth session. `/api/v1` is intentionally outside the browser
session boundary and authenticates with API keys instead.

## Related pages

- [OAuth providers](/docs/application/oauth-providers)
- [API access](/docs/api)
- [Sessions and security](/docs/account/sessions-security)
