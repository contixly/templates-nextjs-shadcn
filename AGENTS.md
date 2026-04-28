# AGENTS.md

This file provides guidance to working with code in this repository.

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## Project Overview

NextJs template with TypeScript, Tailwind CSS v4, Better Auth, Radix UI, Shadcn UI, and Prisma ORM.

## Architecture: Feature Slice Design (FSD)

The project follows FSD principles. Each feature is self-contained in `features/{feature-name}/`:

- `actions/` - Server actions (mutations).
- `components/` - Feature-specific components.
- `{feature}-repository.ts` - Data access layer with caching logic (`"use cache"`).
- `{feature}-types.ts` - TypeScript types and cache tag generators.
- `{feature}-schemas.ts` - Zod validation schemas.
- `{feature}-routes.ts` - Route definitions for the feature.
- `{feature}-logger.ts` - Feature-specific logger instance.

**Rules**:

- `app/` contains only pages and layouts.
- `features/` contain business logic.
- Features depend on `lib/` and `components/`, never on other features.
- Shared UI is in `components/ui/` (shadcn) or `components/application/`.
- `server/` contains server-only singletons (prisma, s3, auth).

## Path Aliases

- `@/*` - Root directory.
- `@components/*` - `components/`.
- `@features/*` - `features/`.
- `@lib/*` - `lib/`.
- `@hooks/*` - `hooks/`.
- `@messages/*` - `messages/`.
- `@server/*` - `server/`.
- `@/prisma/generated/*` - Generated Prisma client (contains `@/prisma/generated/client` for Prisma types and `@/prisma/generated/models` for select types).

## Development Commands

- `npm run dev` - Start development server (runs `prisma generate` first).
- `npm run build` - Build for production (runs `prisma generate` first).
- `npm run start` - Start production server.
- `npm run lint` - Run ESLint.
- `npm run format` - Format code with Prettier.
- `npm run test` - Run all Jest tests.
- `npm run test -- --testPathPatterns=<pattern>` - Run a single test file (e.g., `npm run test -- --testPathPatterns=workspaces`).
- `npm run shadcn:upgrade` - Upgrade all shadcn/ui components to latest.
- `npx prisma migrate dev --name <name>` - Create and apply a migration.
- `npx prisma generate` - Regenerate Prisma client.
- `npx prisma studio` - Open database GUI.
- `npm run migrate:postgres` - Deploy migrations to production database.

**Invalidation**:
After any mutation (Create/Update/Delete), you **MUST**:

- Use `updateTag(CACHE_...Tag(id))` from `@lib/cache` if invoked from server actions.
- Use `revalidatePath("/path")` for affected pages if invoked from API route.

## Server Actions Pattern

All mutations must be server actions. Location: `features/{feature}/actions/`.

**Pattern**:

1. **Validate**: Use Zod `safeParse`.
2. **Authorize**: Check if the user owns the entity.
3. **Mutate**: Prisma transaction or query.
4. **Invalidate**: Update cache tags and revalidate paths.
5. **Return**: Always return `ActionResult<T>`: `{ success: true, data: T }` or `{ success: false, error: { message: string, code?: number } }`.

**Helper Functions**:

- Use `createProtectedActionWithInput<TInput, TResult>(schema, handler, options)` from `@lib/actions` for actions with input.
- Use `createProtectedAction<TResult>(handler, options)` from `@lib/actions` for actions without input.
- These helpers automatically handle validation, user authentication, and error logging.

## UI & Component Patterns

- **Style**: `shadcn/ui` with `radix-lyra` style and `neutral` base color.
- **Shadcn Components**: Do not edit base shadcn components in `src/components/ui/`. If different component behavior is required, override or compose it in `src/components/ui/custom/`.
- **Icons**: `@tabler/icons-react` for specific feature icons.
- **Forms**: Use `React Hook Form` + `Zod` + `useTransition`.
- **Fields**: Use shared `Field`, `FieldLabel`, `FieldError` components from `@components/ui/field`.
- **Theme**: Theme switching is handled by `next-themes` with `ThemeProvider` in root layout.
- **Toast Notifications**: Use `sonner` for toast notifications.
- **Route Metadata**: Use `buildMetadata(page, params)` from `@lib/pages` for page metadata.

## Database Standards

- **ID Generation**: Use `cuid(2)` for all primary keys.
- **Naming**: Use `@map("table_name")` to keep Postgres tables lowercase plural.
- **Indexing**: Always index foreign keys and fields used in `where` clauses (e.g., `userId`).
- **Storage**: Application data in **PostgreSQL** via Prisma. Add object storage (e.g. S3-compatible) when your feature needs large blobs.

## External Services

- **Auth**: Better Auth with Google and GitHub OAuth providers. Route handler at `app/api/auth/[...all]/route.ts`.
- **Prisma**: Uses `pg` adapter with connection pooling. Client is a singleton in `server/prisma.ts`.

## Logging

Use the structured loggerFactory from `@lib/logger`:

```typescript
import { loggerFactory } from "@lib/logger";

const logger = loggerFactory.child({ module: "feature-name" });
logger.debug({ detail: "info" }, "message");
```

- In development: Pretty-printed logs at `debug` level.
- In production: JSON logs at `info` level.

Each feature should have its own logger instance in `{feature}-logger.ts`.

## Next.js Configuration

- `cacheComponents: true` - Cache Components mode is enabled (Next.js 16+).
- `reactCompiler: true` - React Compiler is enabled.
- `output: "standalone"` - Standalone output for Docker deployment.
- `experimental.authInterrupts: true` - Auth interrupts for middleware.

## Git Workflow

- **Branching**: `feature/`, `fix/`, `chore/`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).

## Middleware & Authentication

- **Middleware Location**: `proxy.ts` (not `middleware.ts` to avoid Next.js auto-detection).
- **Auth Provider**: Better Auth with session validation via `auth.api.getSession()`.
- **Route Protection**: Public routes (login, auth API), protected routes (require valid session), and API routes have different handling in the proxy.
- **Current User**: Use `loadCurrentUserId()` from `@features/accounts/accounts-actions` in server actions to get the authenticated user ID.

## Repository Caching Pattern

All data access uses three-layer caching:

1. **Repository Cache**: `"use cache"` directive with `cacheLife("hours")` for 1-hour revalidation.
2. **Tag-based Invalidation**: `cacheTag()` in repositories, `updateTag()` in mutations.
3. **Page Cache**: `revalidatePath()` for affected pages.

**Cache Tag Convention**: `CACHE_{Feature}Tag(id)` functions defined in `{feature}-types.ts`.

## Content Storage

- **Relational data**: Stored in PostgreSQL through Prisma models under `prisma/schema.prisma`.
- **Large blobs**: Not included by default — add an object-storage client under `src/server/` and env vars when you need uploads.

## Learned Workspace Facts

- The project actively uses the Cursor plugin ecosystem (Context7 for docs lookup, Continuous Learning for memory).
- Jest is used for testing; test files live in `test/{feature_name}/{test_module}` (e.g. `test/server/` for server-side code).
