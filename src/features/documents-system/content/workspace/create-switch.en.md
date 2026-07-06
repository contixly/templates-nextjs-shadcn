---
title: "Create and switch workspaces"
description: "Create workspaces, understand workspace URLs, and switch context without losing safe navigation."
group: "Workspace"
groupOrder: 800
parentItem: "Workspace lifecycle"
parentItemOrder: 90
order: 10
toc: true
purpose: "Workspace how-to"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Create and switch workspaces

Workspaces are the product-facing collaboration spaces in the template. Each workspace is backed by
a Better Auth Organization and has a route under `/w/:organizationKey/...`.

## Create a workspace

1. Open the workspace management page from the application shell or onboarding state.
2. Choose **Create workspace**.
3. Enter a workspace name.
4. Save the form.

The application creates the underlying organization and generates a deduplicated slug for the
workspace URL. New workspaces do not create a default team; zero explicit teams is valid.

## Open a workspace

Workspace pages use `/w/:organizationKey/...`, where `organizationKey` can be the organization slug
or id. Slugs are preferred in UI links, but id-based links remain valid for compatibility.

Opening a workspace route validates access before rendering workspace content. Inaccessible routes
show the appropriate protected state instead of leaking workspace data.

## Switch workspace context

Use the workspace switcher in the application shell to move between accessible workspaces. For base
workspace routes, the switcher preserves the equivalent destination in the selected workspace. For
unknown or complex paths, it falls back to the selected workspace dashboard.

Deep links use the workspace from the URL. They do not silently rewrite the user's active workspace
session context unless the user explicitly switches.

## Delete a workspace

Workspace deletion is available only to members with the required organization delete permission.
The template prevents unsafe deletion paths that would leave the user without an accessible working
area.

## Related pages

- [Workspace](/docs/workspace)
- [Workspace settings](/docs/workspace/settings)
- [Users without a workspace](/docs/workspace/no-workspace)
