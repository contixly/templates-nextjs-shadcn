---
title: "6-13 July 2026"
description: "Weekly update for 6-13 July 2026."
group: "History"
parentItem: "Weekly changes"
order: 600
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-07-07"
---

# Weekly update - 6-13 July 2026

## ✨ New features

- **Bilingual documentation library**: Added English and Russian pages for account management, API access, application settings, workspace flows, developer publishing guidance, and release history, so `/docs` now covers more everyday template tasks.

## 🔧 Improvements

- **Documentation navigation**: Refined the `/docs` shell so the sidebar and table of contents keep the current section clearer while readers move through long pages.

- **Documentation search relevance**: Short queries now match exact words more reliably, and multi-word queries keep a readable results layout when an exact phrase is not available.

## 🐛 Fixes

- **Code-example headings**: Lines inside tilde-fenced code examples no longer appear as real documentation headings, anchors, or search hits.

- **Documentation page structure**: Link, metadata, sidebar, and table-of-contents checks were tightened so public documentation pages render with cleaner navigation and fail earlier when a page points at an invalid target.

## 📝 Documentation

- Updated the documents-system OpenSpec requirements for localized pages, canonical links, search behavior, table of contents, metadata, and link validation.
