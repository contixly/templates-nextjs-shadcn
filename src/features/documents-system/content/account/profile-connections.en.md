---
title: "Profile and connections"
description: "Update the display name and manage OAuth provider connections for the current account."
group: "Account"
groupOrder: 900
parentItem: "Profile and connections"
parentItemOrder: 80
order: 10
toc: true
purpose: "Account how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Profile and connections

The profile page separates user identity from provider connections. This keeps basic account data
easy to review while still allowing product teams to enable only the OAuth providers they need.

## Update the display name

1. Open `/user/profile`.
2. Edit the display name.
3. Save the form.

The action validates the new value and rejects empty or unchanged submissions. The email address is
shown as account identity and is not edited from this form.

## Manage connected providers

Open `/user/connections` to review available OAuth providers. Only providers with complete
environment configuration are shown.

Users can link providers that are available and not connected. Unlinking is allowed only when it
does not leave the account without a safe sign-in method.

## Provider configuration

The template supports Google, GitHub, GitLab, VK, and Yandex through Better Auth. A provider appears
in login and connection UI only after the required environment variables are present.

## Related pages

- [Quick start](/docs/general/quick-start)
- [Sessions and security](/docs/account/sessions-security)
- [Runtime security](/docs/application/runtime-security)
