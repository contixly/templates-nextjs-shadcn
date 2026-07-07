---
title: "Releases and changelog"
description: "Maintain release notes and weekly user-visible change summaries for the template."
group: "For developers"
groupOrder: 300
parentItem: "Publishing"
parentItemOrder: 60
order: 10
toc: true
purpose: "Developer publishing reference"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Releases and changelog

The template keeps two public history surfaces: release notes for published versions and weekly
change summaries for user-visible work.

## Release notes

Source release notes live in `docs/releases/template`. Public release pages live under
`src/features/documents-system/content/history/releases`.

Release notes should focus on what template users can do after upgrading: new screens, workflows,
API access, security defaults, localization, and quality checks.

## Weekly changes

Weekly change summaries live under `src/features/documents-system/content/history/change-logs`.
They should be based on real repository history and diffs, not guesses.

Keep weekly notes concrete and user-facing. Avoid internal implementation details unless they affect
how a template adopter uses or configures the service.

## Localization

Public release and changelog pages should have English and Russian variants. Keep canonical links
without locale suffixes.

## Related pages

- [Releases](/docs/history/releases)
- [Weekly changes](/docs/history/change-logs)
- [OpenSpec, E2E, and docs](/docs/developers/openspec-e2e-docs)
