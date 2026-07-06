---
title: "Localization"
description: "How the template uses the configured default locale for UI messages, metadata, and documentation content."
group: "Application"
groupOrder: 500
parentItem: "Localization"
parentItemOrder: 70
order: 10
toc: true
purpose: "Localization explanation"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Localization

The template includes English and Russian message catalogs and a default locale selected by
`PUBLIC_DEFAULT_LOCALE`. The same setting drives application messages and documentation content.

## Supported locales

The supported locales are `en` and `ru`. If `PUBLIC_DEFAULT_LOCALE` is empty or unsupported, the
template falls back to `en`.

## UI messages

User-facing interface text lives in `src/messages`. New feature UI should add messages in both
supported locales and use the existing namespace structure.

## Page metadata

Pages use route metadata helpers so titles, descriptions, Open Graph data, and other metadata can be
resolved from localized messages.

## Documentation content

Documentation files use locale suffixes such as `.en.md` and `.ru.md`. The URL stays canonical:
`/docs/workspace/settings` is the same route for both languages.

If a document exists only in one locale, the documentation system can use it as fallback content and
show a language marker in the UI.

## Cache Components note

The template runs with Next.js Cache Components enabled. The supported deployment model is one
configured default locale per app instance or domain.

## Related pages

- [Localized documentation content](/docs/general/authoring/localized-content)
- [Quick start](/docs/general/quick-start)
- [Runtime security](/docs/application/runtime-security)
