# Dependency Minor Updates Design

**Date:** 2026-08-10

## Goal

Update every direct dependency to the newest release allowed by a minor-only upgrade policy, upgrade Next.js from 16.2.9 to 16.3.0 with its coupled packages, and prove the updated template through linting, unit tests, a production build, and the complete Playwright suite.

## Scope and constraints

- Work occurs only on branch `chore/dependency-minor-updates`.
- No package may move to a new major version; TypeScript remains on 6.x and ESLint remains on 9.x.
- Direct dependencies are updated with `npm-check-updates --target minor`; this updates `package.json` while retaining the no-major constraint.
- `npm install` regenerates `package-lock.json` from the declared dependency versions.
- Next.js, `@next/mdx`, and `eslint-config-next` move together to 16.3.0. React and React DOM move together to 19.2.8.
- No application behaviour, data model, routes, or public documentation is intentionally changed.

## Next.js 16.3 compatibility assessment

The official 16.3 announcements describe optional Instant Navigations/Partial Prefetching and Turbopack improvements, rather than a mandatory migration from 16.2. The project already uses the Next 16 conventions that matter for this upgrade:

- `src/proxy.ts` is already used instead of deprecated `middleware.ts`.
- `next.config.ts` already enables `cacheComponents`, configures images with `remotePatterns`, and uses the current two-argument `revalidateTag(tag, profile)` pattern through `src/lib/cache.ts` and `src/server/cache/isr-cache.mjs`.
- The runtime is Node 24.11.1 and TypeScript stays on 6.0.3, satisfying Next 16 requirements without adopting TypeScript 7.
- The source scan finds no `next/legacy/image`, `images.domains`, legacy one-argument `revalidateTag`, parallel route slots needing `default.tsx`, or pre-existing opt-in 16.3 navigation APIs.

The Next.js 16.3 production build identified one required configuration migration: `experimental.viewTransition` is no longer a recognized key. The application already uses React's `<ViewTransition>` component, and the 16.3 documentation states that App Router view transitions work without configuration, so the obsolete flag is removed while the component remains unchanged.

The build also type-checks the repository's Jest files. The update exposed stale test-only typings and fixtures: API route tests now construct `NextRequest`, the global error test passes its required retry callback, test mocks/fixtures match their current interfaces, the ES2017-compatible regular expression avoids the `s` flag, and the i18n loader accepts unknown locale strings that its runtime fallback already handles. These corrections preserve the tested behaviours; they do not change product routes or user-facing workflows.

The new navigation and Turbopack capabilities remain unenabled: enabling optional performance features would change runtime behaviour and requires separate profiling and product validation.

## Implementation

1. Run `npx npm-check-updates --target minor --upgrade` to update eligible direct dependency ranges. Expected notable changes include Next.js 16.3.0, the matching MDX and ESLint config packages, React 19.2.8, Prisma 7.9.1, Playwright 1.62.1, and the remaining current-major packages.
2. Run `npm install` to regenerate the lockfile and install the resolved dependency graph.
3. Remove `experimental.viewTransition` from `next.config.ts`, because Next.js 16.3 recognizes React `<ViewTransition>` in the App Router without that flag. Update the configuration guidance in `AGENTS.md` to match.
4. Review the manifest and lockfile diff for accidental major-version changes or unrelated file modifications. If updated package APIs cause a failure, make the smallest compatible source adjustment and record why.
5. Run, in order, `npm run lint`, `npm test`, `npm run build`, and `npm run e2e`. A command must exit successfully before the upgrade is accepted.

## Error handling and rollback

- A test, build, or E2E failure is treated as a compatibility finding, not bypassed. Investigate it and either apply the minimal compatible fix or report the blocker.
- A dependency that requires a major upgrade or incompatible peer dependency is kept at the newest compatible minor release.
- The isolated branch allows the whole update to be abandoned without affecting `main`.

## Verification

- Verify the final `package.json` contains only same-major upgrades and preserves coupled-version alignment for `next`, `@next/mdx`, and `eslint-config-next`.
- Verify `package-lock.json` is consistent using `npm install`.
- Verify formatting/lint, unit tests, production build, and the full Playwright E2E suite with the project commands above.
