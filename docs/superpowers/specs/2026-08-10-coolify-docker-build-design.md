# Coolify Docker Build Fix Design

## Goal

Allow Coolify to build and deploy the current `main` revision with the repository Dockerfile after the dependency update.

## Root Cause

`next build` type-checks every file included by `tsconfig.json`. The configuration includes `test/**/*.ts` and `test/**/*.tsx`; two infrastructure tests import helpers from `e2e/support/`. The Docker build context excludes `e2e/` in `.dockerignore`, so those imports resolve locally but are absent in the container and cause `TS2307` during `next build`.

The failure was reproduced with `docker build --no-cache --progress=plain .` on commit `bf4e0df`. The public application and `/api/health` remain available, indicating the previous image is still serving traffic.

## Chosen Approach

Keep `e2e/` in the Docker build context, while continuing to copy only the standalone production output into the final runtime image. This preserves the existing full-project TypeScript check in Next.js without weakening it or introducing a separate production tsconfig. The E2E files are available only to the builder stage and do not increase the runtime image.

Update the separately installed Prisma CLI in `Dockerfile` from `7.8.0` to `7.9.1` so migration tooling matches the updated Prisma packages in `package.json`.

## Verification

1. Re-run a no-cache Docker build; it must finish successfully and print Next.js `16.3.0` and generated Prisma Client `7.9.1`.
2. Run the full Jest suite and ESLint.
3. Push a draft fix PR, merge only after review, then confirm the Coolify deployment is healthy with `/api/health` and the application route.

## Non-Goals

- Do not disable Next.js TypeScript checking.
- Do not remove the existing infrastructure tests or change their imports.
- Do not copy test or E2E files into the final runtime image.
