# Coolify Docker Build Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a successful Coolify Docker deployment for the dependency-updated application.

**Architecture:** Next.js 16.3 type-checks the complete project selected by `tsconfig.json`. The build stage therefore receives the `e2e/` helper sources used by infrastructure tests; the final image remains limited to the standalone output. The dedicated Prisma CLI package in the runner is aligned to `7.9.1`.

**Tech Stack:** Docker multi-stage build, Node 24 Alpine, Next.js 16.3, TypeScript, Prisma 7.9.

## Global Constraints

- Preserve Next.js type checking; do not set `typescript.ignoreBuildErrors`.
- Keep E2E files out of the final runtime stage.
- Keep all package upgrades within their existing major versions.
- Validate the exact Dockerfile path used by Coolify with a no-cache image build.

---

### Task 1: Make TypeScript dependencies available to the Docker builder

**Files:**
- Modify: `.dockerignore:1-32`
- Test: `docker build --no-cache --progress=plain -t nextjs-template:coolify-check .`

**Interfaces:**
- Consumes: `tsconfig.json` includes `test/**/*.ts` and `test/**/*.tsx`.
- Produces: A builder context containing `e2e/support/api-keys.ts` and `e2e/support/global-setup.ts` for Next.js type checking.

- [ ] **Step 1: Reproduce the failing container build**

Run: `docker build --no-cache --progress=plain -t nextjs-template:coolify-check .`

Expected before the fix: `TS2307` for `../../e2e/support/api-keys` and `../../e2e/support/global-setup`.

- [ ] **Step 2: Remove the `e2e` exclusion from `.dockerignore`**

Delete the exact line:

```text
e2e
```

The final Docker stage must remain unchanged and copy only `.next/standalone`, `.next/static`, Prisma files, Sharp dependencies, and the Prisma CLI dependencies.

- [ ] **Step 3: Verify the regression is green**

Run: `docker build --no-cache --progress=plain -t nextjs-template:coolify-check .`

Expected: exit code `0`; the builder logs generated Prisma Client `7.9.1` and Next.js `16.3.0`.

### Task 2: Synchronize Docker Prisma CLI with project dependencies

**Files:**
- Modify: `Dockerfile:22`
- Test: `docker build --no-cache --progress=plain -t nextjs-template:coolify-check .`

**Interfaces:**
- Consumes: `package.json` Prisma and `@prisma/client` ranges `^7.9.1`.
- Produces: A runner-stage `prisma@7.9.1` used by `npm run migrate:postgres`.

- [ ] **Step 1: Change the runner CLI version**

Replace:

```dockerfile
RUN npm install --omit=dev --no-audit --fund=false --no-package-lock --no-save prisma@7.8.0
```

with:

```dockerfile
RUN npm install --omit=dev --no-audit --fund=false --no-package-lock --no-save prisma@7.9.1
```

- [ ] **Step 2: Verify the complete image**

Run: `docker build --no-cache --progress=plain -t nextjs-template:coolify-check .`

Expected: exit code `0`, with the runner image produced after the Next.js build.

### Task 3: Run repository verification and publish

**Files:**
- Modify: `docs/superpowers/specs/2026-08-10-coolify-docker-build-design.md`
- Modify: `docs/superpowers/plans/2026-08-10-coolify-docker-build.md`

**Interfaces:**
- Consumes: the corrected Docker build configuration.
- Produces: a reviewable fix PR and deploy verification evidence.

- [ ] **Step 1: Run the application checks**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: lint exits without errors, Jest passes, and `next build` succeeds.

- [ ] **Step 2: Commit the focused fix**

Run:

```bash
git add .dockerignore Dockerfile docs/superpowers/specs/2026-08-10-coolify-docker-build-design.md docs/superpowers/plans/2026-08-10-coolify-docker-build.md
git commit -m "fix: restore Coolify Docker build"
```

- [ ] **Step 3: Create a draft pull request**

Push `fix/coolify-docker-build` and create a draft PR against `main`. The description must explain the Docker-context root cause, the Prisma CLI alignment, and the command outputs used for verification.

- [ ] **Step 4: Trigger and confirm deployment after merge**

Trigger the Coolify deployment for the merged `main` revision. Confirm the build log reports successful Next.js and Prisma generation, then request `/api/health` and `/` on the configured production base URL and record their HTTP `200` status.
