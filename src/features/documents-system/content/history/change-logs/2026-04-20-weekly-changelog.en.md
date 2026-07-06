---
title: "13-20 April 2026"
description: "Weekly update for 13-20 April 2026."
group: "History"
parentItem: "Weekly changes"
order: 200
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-04-20"
---

# Weekly update - 13-20 April 2026

## ✨ New features

- **Application localization**: Added the localization foundation with `next-intl`, English and Russian message catalogs, locale configuration, and typed page translation namespaces.

- **Localized application flows**: Localized the public home page, auth pages, account settings, workspace screens, dashboard copy, navigation, breadcrumbs, dialogs, forms, and common error states.

- **Localized page metadata**: Page titles, descriptions, Open Graph data, and Twitter metadata now resolve from the same translation namespaces as the visible UI.

## 🔧 Improvements

- **Runtime configuration cleanup**: Updated client-facing analytics configuration and global error handling so localized pages and fallback screens use safer runtime data.

- **Route metadata consistency**: Route definitions now carry page keys and translation namespaces, which makes page headers, breadcrumbs, and metadata use the same source of truth.

## 🐛 Fixes

- **Localized rendering regressions**: Added coverage for translated forms, metadata exports, runtime components, and page translation consumers to prevent hard-coded text from returning to core flows.

## 📝 Documentation

- Added the first template release notes and the internationalization release notes. Documented the localization design and implementation plan for future locale-aware changes.
