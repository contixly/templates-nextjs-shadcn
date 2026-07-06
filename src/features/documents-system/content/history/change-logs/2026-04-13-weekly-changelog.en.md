---
title: "6-13 April 2026"
description: "Weekly update for 6-13 April 2026."
group: "History"
parentItem: "Weekly changes"
order: 100
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-04-13"
---

# Weekly update - 6-13 April 2026

## ✨ New features

- **Initial application template**: Published the first reusable Next.js application baseline with App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma, and Better Auth.

- **Authentication and account areas**: Added the public landing page, protected application shell, login routes, profile settings, connected accounts, session management, account deletion, and health check endpoint.

- **Workspace foundation**: Added starter workspace creation, loading, update, delete, dashboard, and navigation flows so generated apps begin with an authenticated collaboration area.

## 🔧 Improvements

- **Template-focused landing page**: Reworked the home page copy and layout so the template describes the workspace, auth, and reusable application structure instead of placeholder content.

- **Safer theme switching**: Improved the theme switcher hydration behavior so the UI can render predictably before the browser theme state is available.

- **Cleaner workspace data flow**: Removed placeholder workspace counts and simplified repository and component logic for the starter workspace screens.

## 🐛 Fixes

- **Initial build stability**: Fixed early route and import issues found in the first project build checks, including dashboard route naming and Prisma tooling fallback behavior.

## 📝 Documentation

- Added the initial README, template setup checklist, environment example, contribution guide, security policy, and release notes for the first public template baseline.
