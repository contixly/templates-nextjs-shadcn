# Next.js Template

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github)](https://github.com/YOUR_GITHUB_OWNER/YOUR_REPO_NAME/generate)

A neutral starting point for building custom services with Next.js, TypeScript, Tailwind CSS v4, Better Auth, Prisma,
and shadcn/ui.

**Maintainers:** In GitHub go to **Settings → General** and enable **Template repository** so others see the **Use this template** button. Replace `YOUR_GITHUB_OWNER` and `YOUR_REPO_NAME` in the badge URL above (or remove the badge).

**After generating a new repo from this template**, follow **[TEMPLATE.md](./TEMPLATE.md)** for environment variables, auth, and domain setup.

## What This Template Includes

- Authentication with protected and public routes
- Feature Slice Design structure for isolating business logic
- Server actions, validation, and cache invalidation patterns
- Shared UI primitives and layout scaffolding
- Metadata, sitemap, robots, manifest, and OG image setup
- Example modules for workspaces, accounts, and dashboard flows

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js Server Actions, Prisma ORM, PostgreSQL
- **Auth**: Better Auth

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Create a project from this template on GitHub (**Use this template**), or clone the repository.

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies.

```bash
npm install
```

3. Copy [`.env.example`](./.env.example) to `.env.local` and set the values (see **Environment variables** below).

4. Run database migrations.

```bash
npx prisma migrate dev
```

5. Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

Required for local development (see `.env.example` for a minimal set):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma) |
| `BETTER_AUTH_SECRET` | Secret for Better Auth session signing |
| `BETTER_AUTH_URL` | Server-side app URL (e.g. `http://localhost:3000`) |
| `PUBLIC_BASE_URL` | Same origin, exposed to the auth client |

OAuth (configure only what you use; see `src/server/auth.ts`):

| Variable | Providers |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub |
| `GITLAB_CLIENT_ID` / `GITLAB_CLIENT_SECRET` | GitLab |
| `VK_CLIENT_ID` | VK |
| `YANDEX_CLIENT_ID` / `YANDEX_CLIENT_SECRET` | Yandex (generic OAuth) |

## Development Commands

- `npm run dev` - Start development server (runs `prisma generate` first)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run Jest tests

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router (route groups, API routes)
│   ├── components/          # Shared UI (shadcn, application shell)
│   ├── features/            # Feature modules (FSD)
│   ├── lib/                 # Shared utilities
│   ├── server/              # Server-only (Prisma, auth)
│   ├── hooks/               # Shared React hooks
│   ├── messages/            # i18n messages
│   └── types/               # Shared TypeScript types
├── prisma/                  # Schema and migrations
├── public/                  # Static assets
├── test/                    # Jest tests
└── AGENTS.md                # Conventions for contributors and AI assistants
```

## Documentation

- **[TEMPLATE.md](./TEMPLATE.md)** — Checklist after creating a repo from this template
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — How to contribute to the template
- **[SECURITY.md](./SECURITY.md)** — Reporting security issues
- **[AGENTS.md](./AGENTS.md)** — Architecture, commands, and patterns used in the codebase

## License

MIT — see [LICENSE](./LICENSE).
