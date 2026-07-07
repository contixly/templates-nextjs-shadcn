---
title: "Localized documentation content"
description: "Name documentation files by locale, keep canonical URLs stable, and understand fallback language markers."
group: "Documentation"
groupOrder: 400
parentItem: "Authoring"
parentItemOrder: 100
order: 20
toc: true
purpose: "Documentation authoring reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Localized documentation content

Documentation content is localized by file name. The URL stays canonical and does not include the
locale.

## File names

Use explicit locale suffixes for public pages:

- `page.en.md` or `page.en.mdx`;
- `page.ru.md` or `page.ru.mdx`.

For index pages, use `index.en.md` and `index.ru.md`. Both publish at the same canonical URL.

## Canonical URLs

Locale suffixes are removed from URLs. For example:

| File | URL |
| ---- | --- |
| `workspace/settings.en.md` | `/docs/workspace/settings` |
| `workspace/settings.ru.md` | `/docs/workspace/settings` |

Internal links should always use canonical `/docs/...` URLs without `.en` or `.ru`.

## Fallback content

If a page exists only in one locale, the documentation system can use that page as fallback content
for both supported interface languages. The UI shows a language marker when fallback content is
displayed.

Use fallback intentionally. Public template documentation should normally include both `en` and
`ru` variants.

## Validation

The content registry rejects duplicate files for the same canonical URL and locale, unsupported
locale suffixes, locale-suffixed static params, and broken internal links.

## Related pages

- [How to write documentation](/docs/general/authoring/how-to-write-docs)
- [Documentation components](/docs/general/authoring/sample)
- [Localization](/docs/application/localization)
