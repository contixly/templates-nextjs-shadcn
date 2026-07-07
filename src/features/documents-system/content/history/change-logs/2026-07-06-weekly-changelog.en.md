---
title: "29 June-6 July 2026"
description: "Weekly update for 29 June-6 July 2026."
group: "History"
parentItem: "Weekly changes"
order: 500
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-07-06"
---

# Weekly update - 29 June-6 July 2026

## ✨ New features

- **Personal and organization API keys**: Added API key management pages for `/user/api-keys` and `/w/:organizationKey/settings/api-keys` with create, edit, disable, delete, one-time secret display, expiration, rate-limit, and permission preset controls.

- **Scoped API v1 access**: Added starter `/api/v1` endpoints for key metadata, organizations, organization details, members, teams, and team members. API clients authenticate with the `x-api-key` header instead of browser sessions.

- **Public documentation system**: Added `/docs` with a documentation shell, sidebar navigation, breadcrumbs, search, MDX rendering, table of contents, page metadata, heading share links, code-copy controls, and Open Graph images.

- **Localized documentation content**: Documentation files can now use locale suffixes such as `.en.md` and `.ru.md`; the registry selects the matching UI locale and marks fallback content when only one locale exists.

## 🔧 Improvements

- **E2E coverage and automation reliability**: Expanded OpenSpec-backed Playwright coverage across account, workspace, invitation, team, API key, local automation, security, and `/api/v1` flows. Shared helpers now make browser runs more repeatable.

- **API key configuration consistency**: API key config ids and the `x-api-key` header constant were centralized while existing imports remain compatible.

- **Documentation authoring experience**: Added authoring examples, link cards, callouts, tabs, file-tree blocks, localized MDX UI labels, broken-link validation, canonical URL checks, and search indexing for documentation pages.

- **Documentation navigation polish**: Added a documentation link to application navigation, removed the older generic help shortcut, localized documentation UI labels, and aligned documentation typography with the rest of the app.

## 🐛 Fixes

- **Documentation locale regressions**: Fixed default-locale fallback behavior, canonical slug generation, duplicate locale detection, link validation across localized files, missing `documentsSystem.pages.home` messages, and localized reading-time labels.

- **Automation session consistency**: Added session-cookie cache opt-out support for local automation and reused-server Playwright runs so tests read fresh session state.

- **Workspace route refreshes**: Workspace creation and settings updates now revalidate key paths and move slug or route-key changes to the canonical settings route.

## 📝 Documentation

- Added release notes for API key management and E2E coverage, OpenSpec specs for API keys, API v1, local automation, account/session flows, workspace fallbacks, and the documentation system, plus public authoring pages under `/docs`.
