# Dependency Minor Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all direct dependencies within their current major versions, including Next.js 16.3.0, and verify the template with linting, unit tests, a production build, and the full Playwright suite.

**Architecture:** Keep the framework configuration and application code unchanged because the official Next.js 16.3 announcements introduce optional navigation and Turbopack capabilities rather than an obligatory 16.2 migration. Update declared package ranges with `npm-check-updates`, regenerate the npm lockfile, and use existing test coverage to validate runtime compatibility.

**Tech Stack:** npm 11, Node.js 24.11.1, Next.js 16.3.0, React 19.2.8, TypeScript 6.0.3, Jest 30, Playwright 1.62.1.

## Global Constraints

- Work only on branch `chore/dependency-minor-updates`.
- Do not update any direct package to a new major version.
- Keep TypeScript on `^6.0.3` and ESLint on `^9`; do not adopt TypeScript 7 or ESLint 10.
- Align `next`, `@next/mdx`, and `eslint-config-next` at `^16.3.0`.
- Align `react` and `react-dom` at `^19.2.8`.
- Do not enable Next.js 16.3 optional Instant Navigations, Partial Prefetching, Turbopack build caching, or `import.meta.glob`.
- If an existing test or build discovers an actual compatibility error, make the smallest source or configuration change that resolves that specific error and record it in the final commit.

---

### Task 1: Update declared direct dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm registry metadata and the package ranges in `package.json`.
- Produces: Current-major direct dependency ranges and a lockfile resolved from them.

- [ ] **Step 1: Confirm the repository starts on the intended branch with no uncommitted changes**

Run:

```bash
git status --short --branch
git branch --show-current
```

Expected: branch `chore/dependency-minor-updates`; no paths after the branch line.

- [ ] **Step 2: Update direct dependencies through the latest allowed minor release**

Run:

```bash
npx npm-check-updates --target minor --upgrade
```

Expected direct range changes:

```json
{
  "@base-ui/react": "^1.7.0",
  "@better-auth/api-key": "^1.6.26",
  "@better-auth/prisma-adapter": "^1.6.26",
  "@hookform/resolvers": "^5.7.1",
  "@next/mdx": "^16.3.0",
  "@prisma/adapter-pg": "^7.9.1",
  "@prisma/client": "^7.9.1",
  "@tabler/icons-react": "^3.46.0",
  "better-auth": "^1.6.26",
  "next": "^16.3.0",
  "next-intl": "^4.13.5",
  "pg": "^8.23.0",
  "radix-ui": "^1.6.7",
  "react": "^19.2.8",
  "react-dom": "^19.2.8",
  "react-hook-form": "^7.85.0",
  "react-resizable-panels": "^4.12.2",
  "recharts": "^3.10.1",
  "shadcn": "^4.16.2",
  "sonner": "^2.0.8",
  "@playwright/mcp": "^0.0.79",
  "@playwright/test": "^1.62.1",
  "@tailwindcss/postcss": "^4.3.3",
  "@testing-library/jest-dom": "^6.10.0",
  "@types/node": "^26.2.0",
  "@types/pg": "^8.21.0",
  "@types/react": "^19.2.18",
  "eslint-config-next": "^16.3.0",
  "playwright": "^1.62.1",
  "prettier": "^3.9.6",
  "prettier-plugin-tailwindcss": "^0.8.1",
  "prisma": "^7.9.1",
  "tailwindcss": "^4.3.3"
}
```

- [ ] **Step 3: Regenerate and install the dependency graph**

Run:

```bash
npm install
```

Expected: exit code 0 and modifications to `package-lock.json` that correspond to the new direct ranges.

- [ ] **Step 4: Verify installed direct dependencies and coupled package alignment**

Run:

```bash
npm ls --depth=0 next @next/mdx eslint-config-next react react-dom typescript eslint
node - <<'NODE'
const pkg = require('./package.json');
const expected = {
  next: '^16.3.0',
  '@next/mdx': '^16.3.0',
  'eslint-config-next': '^16.3.0',
  react: '^19.2.8',
  'react-dom': '^19.2.8',
  typescript: '^6.0.3',
  eslint: '^9',
};
for (const [name, version] of Object.entries(expected)) {
  const actual = pkg.dependencies[name] ?? pkg.devDependencies[name];
  if (actual !== version) throw new Error(`${name}: expected ${version}, found ${actual}`);
}
NODE
```

Expected: exit code 0; Next packages are 16.3.0; React packages are 19.2.8; TypeScript is 6.x and ESLint is 9.x.

- [ ] **Step 5: Review the dependency-only diff**

Run:

```bash
git diff --check
git diff -- package.json package-lock.json
```

Expected: no whitespace errors and no direct dependency outside its previous major-version line.

### Task 2: Verify Next.js 16.3 project compatibility

**Files:**
- Inspect: `next.config.ts`
- Inspect: `src/proxy.ts`
- Inspect: `src/lib/cache.ts`
- Inspect: `src/server/cache/isr-cache.mjs`
- Modify only if verification reports a concrete compatibility failure.

**Interfaces:**
- Consumes: Next.js 16.3 and the updated dependency graph from Task 1.
- Produces: A configuration that builds and runs with Next.js 16.3 without enabling new optional behaviour.

- [ ] **Step 1: Confirm no mandatory 16.3 migration was introduced**

Run:

```bash
grep -RInE "(next/legacy/image|images[[:space:]]*:[[:space:]]*\{|domains[[:space:]]*:|revalidateTag\([^,)]*\))" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . || true
```

Expected: no `next/legacy/image`, `images.domains`, or single-argument `revalidateTag()` uses. The current `images` configuration and domain-restriction application data are valid results and require no change.

- [ ] **Step 2: Run the Next.js production build**

Run:

```bash
npm run build
```

Expected: exit code 0. This regenerates the Prisma client as part of the existing script and proves Next.js 16.3 resolves the application routes, MDX configuration, cache handlers, and proxy.

- [ ] **Step 3: Handle a compatibility failure only when observed**

If Step 2 fails because of an updated package API or a Next.js 16.3 validation error:

1. Add or update the narrowest existing Jest or Playwright test that reproduces the affected user-visible behaviour, when the changed code has such coverage.
2. Run that test before the source change and verify it fails for the reported compatibility issue.
3. Apply the minimum source or configuration correction.
4. Re-run the focused test and then `npm run build`.

Do not add Instant Navigations, Partial Prefetching, Turbopack build cache, or `import.meta.glob` merely because they are available in 16.3.

### Task 3: Run the complete verification suite

**Files:**
- Modify only files demanded by a concrete failure in Task 2 or this task.

**Interfaces:**
- Consumes: Installed dependencies and the successfully compiled application from Tasks 1 and 2.
- Produces: Fresh evidence that static analysis, unit behaviour, production compilation, and browser workflows remain compatible.

- [ ] **Step 1: Run ESLint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 2: Run the complete Jest suite**

Run:

```bash
npm test
```

Expected: exit code 0 with all Jest test suites passing.

- [ ] **Step 3: Run the complete Playwright E2E suite**

Run:

```bash
npm run e2e
```

Expected: exit code 0 with all Playwright tests passing. The configured command starts a local development server with `LOCAL_AUTOMATION_AUTH_ENABLED=true` and `AUTH_DISABLE_SESSION_COOKIE_CACHE=true` when needed.

- [ ] **Step 4: Re-run a failed verification after each correction**

For any failure in Steps 1–3, use the smallest relevant command to reproduce it after the fix, then run the exact failed full command again. Do not suppress, skip, or quarantine existing tests.

### Task 4: Commit the dependency update

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify only any source or test files required by a verified compatibility correction.

**Interfaces:**
- Consumes: Green results from Tasks 1–3.
- Produces: A reviewable dependency-update commit on `chore/dependency-minor-updates`.

- [ ] **Step 1: Inspect the final patch and worktree status**

Run:

```bash
git diff --check
git status --short
git diff --stat
git diff -- package.json package-lock.json
```

Expected: only dependency, lockfile, plan/spec, and explicitly justified compatibility files are changed.

- [ ] **Step 2: Commit verified dependency changes**

Run:

```bash
git add package.json package-lock.json
# Add any source or test file only when a failing verification required its compatibility correction.
git commit -m "chore: update minor dependencies"
```

Expected: one commit containing the verified dependency manifests and any strictly necessary compatibility correction.
