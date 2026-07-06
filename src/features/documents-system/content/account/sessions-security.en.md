---
title: "Sessions and security"
description: "Review active sessions, revoke access safely, and understand the template's account security boundaries."
group: "Account"
groupOrder: 900
parentItem: "Security"
parentItemOrder: 70
order: 10
toc: true
purpose: "Account security how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Sessions and security

The security page helps users review active sessions and revoke access without exposing raw session
tokens in the browser.

## Review sessions

Open `/user/security` to see session metadata such as device, location, and timestamps. The current
session is clearly separated from other sessions.

The page is intentionally limited to safe identifiers. Secret session tokens are resolved and
handled on the server.

## Revoke one session

Use the row action for a session that is not the current one. The server resolves the token for the
selected session and revokes it.

The current session cannot be revoked through the single-session action. This prevents a confusing
"revoke the page you are using" flow.

## Revoke all other sessions

Use the bulk revoke action to sign out every other active session while preserving the current one.
This is useful after password, provider, or device concerns.

## Security expectations

Protected account actions ignore forged client identity and always load the authenticated session on
the server. Product features built on top of the template should follow the same protected-action
pattern.

## Related pages

- [Profile and connections](/docs/account/profile-connections)
- [Runtime security](/docs/application/runtime-security)
- [Server actions](/docs/developers/server-actions)
