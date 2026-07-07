---
title: "27 April-4 May 2026"
description: "Weekly update for 27 April-4 May 2026."
group: "History"
parentItem: "Weekly changes"
order: 400
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-05-04"
---

# Weekly update - 27 April-4 May 2026

## ✨ New features

- **Workspace teams**: Replaced the Teams settings placeholder with Better Auth Teams support, team creation, rename, deletion, member assignment, member removal, and read-only views for regular members.

- **Team-targeted invitations**: Invitations can now optionally target a workspace team. Invitation tables, pending cards, and decision pages show the target team, and accepted team invitations add the user to that team.

- **Distributed caching**: Added optional Redis/Valkey-backed cache handlers for Cache Components and ISR, with shared environment settings and local fallback behavior.

- **Local automation auth and Playwright E2E**: Added a local-only automation sign-in flow, `/api/local-auth/scenario`, Playwright scripts, Chromium smoke coverage, route warming, and first-party error detection.

## 🔧 Improvements

- **Workspace loading states**: Dashboard and workspace settings now use local Suspense boundaries and skeletons instead of a broad full-route loading fallback.

- **Configured social providers**: Login, account linking, and navigation now show only OAuth providers that have the required environment variables configured.

- **Navigation polish**: Added richer sidebar navigation, workspace creation access, secondary links, user menu entries, and explicit mobile-sidebar close behavior.

- **Form feedback**: Loading and validation UI now uses shared button, field-message, and form-error components for steadier form layouts.

## 🐛 Fixes

- **Invitation policy enforcement**: Better Auth organization hooks now enforce workspace email-domain and team-target policies even when raw plugin calls bypass feature actions.

- **Account connection safety**: Users cannot unlink the last configured social provider that still gives them access to the account.

## 📝 Documentation

- Added release notes for teams, distributed caching, and local automation. Updated E2E documentation, environment setup, README, OpenSpec specs, and agent guidance for browser automation workflows.
