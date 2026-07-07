# AGENTS.md

This file provides guidance to working with code in this repository.

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## Project Overview

NextJs template with TypeScript, Tailwind CSS v4, Better Auth, Radix UI, Shadcn UI, and Prisma ORM.

## Architecture: Feature Slice Design (FSD)

The project follows FSD principles. Each feature is self-contained in `src/features/{feature-name}/`:

- `actions/` - Server actions (mutations).
- `components/` - Feature-specific components.
- `{feature}-repository.ts` - Data access layer with caching logic (`"use cache"`).
- `{feature}-types.ts` - TypeScript types and cache tag generators.
- `{feature}-schemas.ts` - Zod validation schemas.
- `{feature}-routes.ts` - Route definitions for the feature.
- `{feature}-logger.ts` - Feature-specific logger instance.

**Rules**:

- `src/app/` contains only pages and layouts.
- `src/features/` contain business logic.
- Features depend on `src/lib/` and `src/components/`, never on other features.
- Shared UI is in `src/components/ui/` (shadcn) or `src/components/application/`.
- `src/server/` contains server-only singletons (prisma, s3, auth).

## Path Aliases

- `@/*` - Root directory.
- `@components/*` - `src/components/`.
- `@features/*` - `src/features/`.
- `@lib/*` - `src/lib/`.
- `@hooks/*` - `src/hooks/`.
- `@messages/*` - `src/messages/`.
- `@server/*` - `src/server/`.
- `@typings/*` - `src/types/`.
- `@/prisma/generated/*` - Generated Prisma client (contains `@/prisma/generated/client` for Prisma types and `@/prisma/generated/models` for select types).

## Development Commands

- `npm run dev` - Start development server (runs `prisma generate` first).
- `npm run build` - Build for production (runs `prisma generate` first).
- `npm run start` - Start production server.
- `npm run lint` - Run ESLint.
- `npm run format` - Format code with Prettier.
- `npm run test` - Run all Jest tests.
- `npm run test -- --testPathPatterns=<pattern>` - Run a single test file (e.g., `npm run test -- --testPathPatterns=workspaces`).
- `npm run e2e` - Run Playwright E2E tests; by default this starts `npm run dev` on the configured Playwright base URL.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3127 npm run e2e` - Run E2E tests against an explicit base URL; this is the default from `e2e/support/config.ts`.
- `PLAYWRIGHT_START_SERVER=false npm run e2e` - Run E2E tests against an already running app; set `PLAYWRIGHT_BASE_URL` if it is not on the default origin.
- `npm run e2e:install` - Install the Chromium browser used by local Playwright runs.
- `npm run e2e:headed` - Run Playwright E2E tests in headed mode.
- `npm run e2e:ui` - Open the Playwright UI runner.
- `npm run e2e:report` - Open the saved Playwright HTML report.
- `npm run shadcn:upgrade` - Upgrade all shadcn/ui components to latest.
- `npm run openspec:ui` - Open the OpenSpec UI.
- `npx prisma migrate dev --name <name>` - Create and apply a migration.
- `npx prisma generate` - Regenerate Prisma client.
- `npx prisma studio` - Open database GUI.
- `npm run migrate:postgres` - Deploy migrations to production database.

## OpenSpec Workflow

When a feature change affects existing OpenSpec capabilities or introduces behavior that should be specified, route the
work through the relevant OpenSpec skill (`openspec-propose`, `openspec-apply-change`, `openspec-retrofit`, or
`openspec-archive-change`) before implementation. Keep the specs, implementation, and related e2e coverage aligned:
inspect existing tests, fix broken tests, and add focused e2e tests for spec-visible user/API workflows when the
behavior changes.

When adding or changing application functionality, also review public user documentation for the affected behavior. Add,
update, or remove documentation pages in the same change when the user-facing workflow, route, permission model, API
surface, settings behavior, or release-visible capability changes. If the code and docs/specs disagree, verify the real
behavior from source and tests, then update the stale artifact rather than leaving the mismatch in place.

OpenSpec-backed Playwright tests live in `e2e/specs/<capability>/`, mirroring `openspec/specs/<capability>/spec.md`.
Keep quick reachability/browser checks in `e2e/smoke/`.

## Public User Documentation

Public user documentation lives in `src/features/documents-system/content/` and is rendered under `/docs` by the
documents-system feature. Treat this content as a maintained user-facing product surface, not as internal engineering
notes. Write in plain language for template adopters and end users, and avoid internal implementation detail unless it
changes what the reader can do or must configure.

Content files are Markdown or MDX. Use locale suffixes for translated pages: `.en.md` / `.en.mdx` and `.ru.md` /
`.ru.mdx`. The canonical URL must not include the locale suffix; for example, `history/releases/0.0.10.en.mdx` and
`history/releases/0.0.10.ru.mdx` both publish at `/docs/history/releases/0.0.10`. Unsuffixed content is treated as the
configured `PUBLIC_DEFAULT_LOCALE` and should be used only when a deliberate fallback page is acceptable.

Every public doc page needs valid frontmatter: `title`, `description`, `group`, `parentItem`, numeric `order`, boolean
`toc`, and `status`. Use `groupOrder` and `parentItemOrder` when a new section must sort predictably in the sidebar.
Published user docs should use `status: "published"`; local-only authoring examples can use non-production statuses or
`hide: true` when appropriate. Keep internal links canonical, starting with `/docs/...`, so the documents-system link
validator can catch broken or unpublished targets.

Current content areas:

- `index.*.mdx` - documentation home and entry points.
- `general/` - glossary and authoring guidance.
- `workspace/` - workspace, organization, member, team, invitation, settings, and API-key user guidance.
- `history/releases/` - release notes derived from `docs/releases/template/` and exposed as public docs.
- `history/change-logs/` - weekly user-visible change summaries based on real repository history.

When changing visible behavior, update the closest concrete user doc first. Do not spread small UI wording changes across
index, glossary, releases, and changelog pages unless the behavior actually affects those surfaces. When adding a new
public doc section, keep the navigation metadata consistent, add both supported locales when possible, update indexes or
link cards that make the page discoverable, and run the documents-system checks before calling the work complete.

## E2E Testing

Playwright E2E tests live under `e2e/`. OpenSpec-backed user/API scenarios belong in `e2e/specs/<capability>/`,
mirroring `openspec/specs/<capability>/spec.md`; quick reachability and browser smoke checks belong in `e2e/smoke/`.
When functionality is added or changed, inspect the matching OpenSpec capability and existing E2E specs, then update or
add focused coverage for the changed user-visible workflow. Do not leave new behavior covered only by unit tests when it
changes a spec-visible browser or API flow.

Use shared E2E infrastructure instead of ad hoc setup:

- Import `test` and `expect` from `e2e/support/test`.
- Use route constants from `e2e/support/routes`.
- Use local auth helpers from `e2e/support/local-auth`.
- Use workspace and invitation helpers from `e2e/support/workspaces` and `e2e/support/invitations`.
- Use API key helpers from `e2e/support/api-keys` when a scenario needs machine access.

The default `npm run e2e` path starts its own dev server on the configured Playwright base URL and sets the local
automation/session-cache environment expected by the suite. Use `PLAYWRIGHT_START_SERVER=false` only when intentionally
testing against an already running app, and then ensure that app was started with the same required local automation and
session-cache settings. For feature work, prefer focused capability runs while iterating, then run the relevant default
or broader E2E command before declaring the browser/API workflow covered.

## Local Automation Auth

For local browser automation with Playwright, browser-use, or LLM-driven development agents, enable the local-only Better Auth automation flow:

1. Set `LOCAL_AUTOMATION_AUTH_ENABLED=true` in the local environment. For tests that depend on fresh session reads, also set `AUTH_DISABLE_SESSION_COOKIE_CACHE=true`. Never enable local automation auth in production. `npm run e2e` sets both defaults when Playwright starts the dev server itself.
2. Start the app with `npm run dev`.
3. From the same browser/API context used by the scenario, create and sign in a new user. Prefer `signInLocalAutomationUser(page)` from `e2e/support/local-auth`:

   ```ts
   const scenario = await signInLocalAutomationUser(page);
   ```

   Or call the route directly and read the `data` envelope:

   ```ts
   const response = await page.request.post("/api/local-auth/scenario", {
     data: {},
   });
   const { data: scenario } = await response.json();
   ```

4. Use the same browser context to test protected pages. The create response sets the real Better Auth session cookie.
5. Clean up the current automation user and its now-memberless local organizations from the same authenticated context. Prefer `cleanupLocalAutomationUser(page)` from `e2e/support/local-auth`, or call:

   ```ts
   await page.request.delete("/api/local-auth/scenario");
   ```

The endpoint works only when `NODE_ENV !== "production"` and `LOCAL_AUTOMATION_AUTH_ENABLED=true`. Cleanup refuses non-automation users; automation users use the `local-agent+...@local-agent.test` email namespace.

**Invalidation**:
After any mutation (Create/Update/Delete), you **MUST**:

- Use `updateTag(CACHE_...Tag(id))` from `@lib/cache` if invoked from server actions.
- Use `revalidatePath("/path")` for affected pages if invoked from API route.

## Server Actions Pattern

All mutations must be server actions. Location: `src/features/{feature}/actions/`.

Exception: framework/external API surfaces use route handlers under `src/app/api/` (Better Auth, local automation auth, health, and `/api/v1`). Keep those handlers thin: validate request input, authorize at the route/helper boundary, call feature/server modules, and revalidate affected paths when they mutate data.

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

- **Auth**: Better Auth with configured OAuth providers (Google, GitHub, GitLab, VK, Yandex), organization/teams, and API key plugins. Route handler at `src/app/api/auth/[...all]/route.ts`.
- **Prisma**: Uses `pg` adapter with connection pooling. Client is a singleton in `src/server/prisma.ts`.

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
- `cacheHandler` points to `src/server/cache/isr-cache.mjs` for ISR/server cache storage.
- `cacheHandlers.default` and `cacheHandlers.remote` point to `src/server/cache/cache.mjs` for `"use cache"` storage; remote Redis/Valkey mode is enabled with `REMOTE_CACHING_ENABLED=true` plus `REDIS_URL` or `VALKEY_URL`.
- `cacheMaxMemorySize: 0` disables Next's built-in in-memory cache in favor of the configured handlers.
- `reactCompiler: true` - React Compiler is enabled.
- `output: "standalone"` - Standalone output for Docker deployment.
- `experimental.authInterrupts: true` - Auth interrupts for `forbidden`/`unauthorized` APIs are enabled.
- `experimental.viewTransition: true` - Next.js integration for React View Transitions is enabled.

## Git Workflow

- **Branching**: `feature/`, `fix/`, `chore/`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).

## Middleware & Authentication

- **Proxy Location**: `src/proxy.ts` uses the Next.js Proxy file convention; `middleware.ts` is the deprecated name in Next.js 16.
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

- Jest is used for testing; test files live in `test/{feature_name}/{test_module}` (e.g. `test/server/` for server-side code).
- Playwright E2E tests live under `e2e/`; `e2e/smoke/` is for quick browser smoke checks and `e2e/specs/` is for OpenSpec-backed scenarios. Jest ignores the `e2e/` tree.
- E2E specs and smoke tests should import shared `test` and `expect` from `e2e/support/test`; it retries first-party cold-route 404s and fails on uncaught page errors or first-party 5xx responses.
- Use E2E helpers from `e2e/support/routes`, `e2e/support/local-auth`, `e2e/support/workspaces`, and `e2e/support/invitations` instead of duplicating routes, auth setup, selectors, or workspace/invitation flow glue.
