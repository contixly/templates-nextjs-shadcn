---
title: "Settings shell"
description: "How account and workspace settings pages stay consistent across sections and themes."
group: "Application"
groupOrder: 500
parentItem: "Settings"
parentItemOrder: 60
order: 10
toc: true
purpose: "Settings surface explanation"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Settings shell

The shared settings shell keeps account and workspace settings predictable. Readers should see the
same layout grammar whether they are editing their profile or managing workspace users.

## Page structure

Every settings page starts with a contextual intro. Below it, content is grouped into section
islands:

- forms are grouped by decision area;
- tables and lists are grouped as scannable islands;
- empty states stay inside their owning section.

## Width modes

Dense tables, such as users or teams, can use wider layouts. Focused forms, such as profile or
workspace details, stay in a readable width.

## Theme behavior

Settings pages are designed to stay readable in light and dark themes. Destructive areas remain
visually distinct without dominating the page.

## Extension guidance

New settings sections should use the same shell and avoid inventing local page chrome. Add a clear
intro, group content by task, and expose controls only when the current user has permission to act.

## Related pages

- [Account settings](/docs/account)
- [Workspace settings](/docs/workspace/settings)
- [Feature slice architecture](/docs/developers/feature-slice)
