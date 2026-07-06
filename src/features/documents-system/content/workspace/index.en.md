---
title: "Workspace"
description: "How the template models workspaces, organization-backed routes, members, teams, invitations, and settings."
group: "Workspace"
groupOrder: 600
parentItem: "Overview"
parentItemOrder: 70
order: 10
toc: true
purpose: "Template user documentation"
status: "published"
author: "Template Maintainers"
version: "1.1.0"
editedAt: "2026-07-06"
---

# Workspace

Workspace is the user-facing name for an application working area. In the template, each workspace
is backed by a Better Auth Organization: the organization stores members, roles, teams,
invitations, API keys, and access settings.

This page explains the baseline flows that already exist in the template and can be extended for
your own product.

## Workspace model

- **Workspace backed by organization**: users see a workspace, while the application stores it as a
  Better Auth Organization.
- **Workspace URL**: protected workspace pages live under `/w/:organizationKey/...`, where
  `organizationKey` is an organization slug or id.
- **Dashboard entry point**: global `/dashboard` redirects to the active workspace. If there is no
  valid active workspace, the app chooses a deterministic accessible fallback.
- **URL context**: when a deep link is opened, the application uses the workspace from the URL and
  does not change the active workspace unless the user explicitly switches.

## Workspace settings

Workspace settings are split into dedicated pages inside the shared settings shell.

| Section | What it provides |
| ------- | ---------------- |
| Details | Workspace name and slug. Users without update permission see read-only values. |
| Users | Member list, current-user context, roles, direct existing-user add, and email-domain policy warnings. |
| Invitations | Invitation creation, list, status, and share links. The section is visible only to users with the required permissions. |
| Teams | Team creation, rename, deletion, and team member management. Regular members can view teams without management actions. |
| Roles | Reserved section for future role expansion. |
| API keys | Workspace API keys for machine access to `/api/v1` when the user's role permits key management. |

## Members and roles

The template includes built-in **owner**, **admin**, and **member** roles. Owners and admins can
manage most workspace settings. Members keep read access where it is safe, such as member lists,
teams, and settings context.

Workspace deletion is guarded against unsafe outcomes: a user should not delete their last
accessible workspace and leave themselves without a working area.

## Invitations and email domains

Workspace admins can create invitations and copy invite links. After signing in, invitees see a
decision page where they can accept or reject the invitation. Acceptance requires the user's
verified primary email to match the invited address.

A workspace can restrict new invitations to configured email domains. This does not remove existing
members, but it surfaces warnings for members outside the current policy.

## Teams

Teams are explicit subgroups inside a workspace. New workspaces do not create a team automatically:
zero teams is a valid state. Authorized members can create, rename, and delete teams and add
existing workspace members to them.

A team-targeted invitation adds the user to the workspace and to the selected team after the
invitation is accepted.

## Workspace API access

Workspace API keys are managed from workspace settings and act as one organization. They are useful
for server integrations that need read-only `/api/v1` access to workspace, member, and team data.

Personal API keys live in the user's account settings and act as the owning user. Both key types use
the `x-api-key` header, scopes, expiration, and rate limits.

## Users without a workspace

When a user has no accessible workspaces, the application shows an onboarding guard. It does not
block global account pages or workspace management: the user can create a workspace or open personal
invitations.

## Related pages

- [Glossary](/docs/general/glossary) - definitions for workspace, organization, API key, and other terms.
- [Releases](/docs/history/releases) - published template history.
- [Weekly changes](/docs/history/change-logs) - short notes for recent changes.
