---
title: "How to write documentation"
description: "Rules for structure, metadata, and public documentation content"
group: "General"
groupOrder: 700
parentItem: "Introduction"
order: 20
status: "published"
hide: true
toc: true
author: "Molchanov N."
version: "1.0.1"
editedAt: "2026-06-01"
---

# How to write documentation

A document should describe one clear behavior, module, or user scenario. If a page starts mixing independent topics, split it into smaller child documents.

## Metadata

Every page starts with metadata:

```md
---
title: "Page title"
description: "Short description for headers and SEO"
group: "Events Program"
parentItem: "Voting Panel"
order: 10
status: "draft"
toc: true
---
```

`group` controls the top-level section in the left menu. `parentItem` groups child pages inside that section. `order` controls the page position. `status: "draft"` and `status: "review"` are hidden in production, and `hide: true` hides the page in production for every status.

Set `editedAt` manually in `YYYY-MM-DD` format for pages that will be published or archived.

## Recommended page structure

Use a stable order:

1. A short description of the scenario or module.
2. When and for whom the page is useful.
3. Main concepts and roles.
4. Step-by-step behavior or rules.
5. Limits, errors, and edge cases.
6. Related pages or components.

## Headings and anchors

The right table of contents is built from second-level headings. Main page sections should start with `##`. Use third-level headings only inside long sections.

## MDX components

Plain Markdown is enough for most pages. If a page needs an interactive or highlighted block, convert it to MDX and use shared components:

- `Callout` for important notes, warnings, or limits.
- `Steps` and `Step` for step-by-step instructions.
- `Files`, `Folder`, and `File` for file or module structure.
- `Tabs` for switching between description, example, and code.

## Links to code

If a document describes a specific module, point to real paths:

- route in `src/app`;
- feature in `src/features`;
- shared component in `src/components`;
- tests in `test`.

This reduces drift and makes it clear where to verify the described behavior.
