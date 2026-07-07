---
title: "20-27 April 2026"
description: "Weekly update for 20-27 April 2026."
group: "History"
parentItem: "Weekly changes"
order: 300
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-04-27"
---

# Weekly update - 20-27 April 2026

## ✨ New features

- **Organization-backed workspaces**: Workspaces now use Better Auth organizations while keeping "Workspace" as the user-facing term. The app gained organization-scoped routes under `/w/:organizationKey`.

- **Workspace settings and collaboration**: Added settings pages for workspace details, users, invitations, teams, and roles, plus member directories, role management, invitation creation, invitation review, and zero-workspace onboarding.

- **Allowed email-domain policies**: Workspace admins can configure allowed email domains, enforce them for invitations, and see clear warnings when existing members are outside the active policy.

## 🔧 Improvements

- **Security defaults**: Added browser security headers, production HSTS, strict remote image policy, safer auth redirect handling, and normalized public app URL configuration.

- **Invitation and member privacy**: Invitation details are hidden when the signed-in user is not the invited recipient, duplicate pending invitations are prevented, and invitation acceptance updates the active workspace.

- **Workspace identity safeguards**: Workspace slugs are checked across all organizations, and workspace renames no longer change the slug unless a new slug is explicitly submitted.

## 🐛 Fixes

- **Protected action boundary**: Protected server actions now use the validated Better Auth session instead of trusting forwarded user-id headers.

- **Account session safety**: Account session lists no longer expose raw Better Auth session tokens to the client.

## 📝 Documentation

- Added release notes for organization-backed workspaces, security hardening, and domain restrictions. Updated README, template setup notes, and OpenSpec requirements for workspace management and invitations.
