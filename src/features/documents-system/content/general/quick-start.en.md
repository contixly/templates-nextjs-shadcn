---
title: "Quick start"
description: "Create a project from the template, configure the required services, and verify that the first local run works."
group: "General"
groupOrder: 2000
parentItem: "Getting started"
parentItemOrder: 900
order: 10
toc: true
purpose: "Template setup tutorial"
status: "published"
author: "Template Maintainers"
version: "1.2.0"
editedAt: "2026-07-06"
---

# Quick start

Use this page when you are creating a new service from the template. It covers the minimum path from
a generated repository to a working local application with authentication, database access, and
workspace flows available for review.

## What you need

- Node.js 22 or newer.
- A PostgreSQL database for Prisma.
- Optional Redis or Valkey if you want distributed Cache Components and ISR storage.
- OAuth application credentials for the providers you want to show on the login page.

## Create the repository

Create a repository from the GitHub template, then install dependencies:

```bash
npm install
```

Update the new project's package name and visible metadata before publishing the service. Use the
repository checklist in `TEMPLATE.md` for the full handoff list.

## Configure environment variables

Copy the environment values from `.env.example` or the README into `.env.local`. The required local
values are:

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma. |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth sessions. |
| `BETTER_AUTH_URL` | Server-side application origin, for example `http://localhost:3000`. |
| `NEXT_PUBLIC_APP_BASE_URL` | Public application origin used by browser-side code. |
| `PUBLIC_DEFAULT_LOCALE` | Default UI and documentation locale. The template falls back to `en`. |

Configure OAuth provider variables only for providers you actually use. Providers with incomplete
credentials stay hidden from login and account connection screens.

## Prepare the database

Run the Prisma migration after `DATABASE_URL` is set:

```bash
npx prisma migrate dev
```

Use `npx prisma studio` if you need to inspect local users, sessions, organizations, teams, or API
keys while evaluating the template.

## Start the app

Start the development server:

```bash
npm run dev
```

Open `/` to review the public page, `/auth/login` to sign in, and `/docs` to read the public
documentation. After signing in, the workspace flows guide users to create a workspace or review
pending invitations.

## Verify the template surface

Run the relevant checks before treating the generated service as ready for product work:

```bash
npm run lint
npm run test
npm run e2e
```

The E2E command starts its own local server by default and enables the local automation auth flags
needed by browser scenarios.

## Next steps

- Read [Workspace](/docs/workspace) to understand the organization-backed collaboration model.
- Read [API keys](/docs/api) before exposing integrations.
- Read [For developers](/docs/developers) before adding your first product feature.
