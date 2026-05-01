# Playwright E2E and MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright E2E testing, Playwright MCP configuration, an OpenSpec-oriented `e2e/` test tree, and the first public UI smoke test.

**Architecture:** Keep durable regression tests in `@playwright/test` under `e2e/`, with smoke tests separated from OpenSpec-backed requirement tests. Keep MCP as agent tooling in `.agents/mcp/mcp.json`, separate from the test runner. Shared E2E helpers live in `e2e/support/`.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@playwright/test`, `@playwright/mcp`, existing `next-devtools-mcp`, npm scripts.

---

### Task 1: Confirm Local Docs and Starting State

**Files:**
- Read: `node_modules/next/dist/docs/01-app/02-guides/mcp.md`
- Read: `node_modules/next/dist/docs/01-app/02-guides/local-development.md`
- Read: `docs/superpowers/specs/2026-05-01-playwright-e2e-mcp-design.md`

- [ ] **Step 1: Re-read the relevant Next.js MCP docs**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/02-guides/mcp.md
```

Expected: output describes `.mcp.json` with `next-devtools-mcp` and mentions Playwright MCP integration for browser testing.

- [ ] **Step 2: Re-read the relevant Next.js local development docs**

Run:

```bash
sed -n '1,180p' node_modules/next/dist/docs/01-app/02-guides/local-development.md
```

Expected: output confirms local `next dev` behavior and reinforces using local development instead of Docker for the fastest feedback loop.

- [ ] **Step 3: Re-read the approved design**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-01-playwright-e2e-mcp-design.md
```

Expected: output includes the approved `e2e/smoke`, `e2e/specs`, and `e2e/support` structure.

- [ ] **Step 4: Confirm the worktree has no unexpected changes**

Run:

```bash
git status --short
```

Expected: no output, or only changes the current worker intentionally made.

### Task 2: Add Playwright Dependencies and npm Scripts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install Playwright packages**

Run:

```bash
npm install --save-dev @playwright/test @playwright/mcp
```

Expected: `package.json` gains `@playwright/test` and `@playwright/mcp` under `devDependencies`, and `package-lock.json` is updated.

- [ ] **Step 2: Add E2E scripts to `package.json`**

Modify the `scripts` object so it includes these keys:

```json
{
  "dev": "prisma generate && next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "test": "jest",
  "e2e": "playwright test",
  "e2e:headed": "playwright test --headed",
  "e2e:ui": "playwright test --ui",
  "e2e:report": "playwright show-report",
  "lint": "eslint",
  "format": "prettier --write .",
  "migrate:postgres": "dotenv -e .env -- npx prisma migrate deploy",
  "shadcn:upgrade": "npx shadcn@latest add -y -o $(basename -s .tsx ./src/components/ui/*.tsx | grep -v '^sidebar$')",
  "skills:update": ".agents/skills-update.sh",
  "openspec:ui": "npx openspecui@latest"
}
```

Keep all existing scripts not shown here unchanged if the file has changed since this plan was written.

- [ ] **Step 3: Install the Chromium browser used by the initial project**

Run:

```bash
npx playwright install chromium
```

Expected: command exits successfully and Chromium is available for local Playwright runs.

- [ ] **Step 4: Verify the Playwright CLI is available**

Run:

```bash
npx playwright --version
```

Expected: output starts with `Version `.

- [ ] **Step 5: Commit dependency and script changes**

Run:

```bash
git add package.json package-lock.json
git commit -m "test: add playwright dependencies"
```

Expected: a commit is created with only `package.json` and `package-lock.json`.

### Task 3: Add Playwright MCP Server Configuration

**Files:**
- Modify: `.agents/mcp/mcp.json`

- [ ] **Step 1: Replace `.agents/mcp/mcp.json` with this MCP server set**

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

- [ ] **Step 2: Verify the JSON is valid**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('.agents/mcp/mcp.json', 'utf8')); console.log('valid mcp json')"
```

Expected:

```text
valid mcp json
```

- [ ] **Step 3: Verify the Playwright MCP package can start enough to print help**

Run:

```bash
npx @playwright/mcp@latest --help
```

Expected: command exits with usage/help text for the Playwright MCP server.

- [ ] **Step 4: Commit MCP configuration**

Run:

```bash
git add .agents/mcp/mcp.json
git commit -m "chore: add playwright mcp server"
```

Expected: a commit is created with only `.agents/mcp/mcp.json`.

### Task 4: Add Playwright Config and Ignore Generated Artifacts

**Files:**
- Create: `playwright.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const startWebServer = process.env.PLAYWRIGHT_START_SERVER !== "false";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results/playwright",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: startWebServer
    ? {
        command: "npm run dev -- --hostname 127.0.0.1",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          LOCAL_AUTOMATION_AUTH_ENABLED:
            process.env.LOCAL_AUTOMATION_AUTH_ENABLED || "true",
        },
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 2: Add Playwright artifacts to `.gitignore`**

Append this block under the existing `# testing` section:

```gitignore
/playwright-report
/test-results
/blob-report
```

The `# testing` section should then include:

```gitignore
# testing
/coverage
/playwright-report
/test-results
/blob-report
```

- [ ] **Step 3: Validate the config can be loaded**

Run:

```bash
npx playwright test --list --pass-with-no-tests
```

Expected: command exits successfully and reports no tests or an empty list because no `e2e/` specs exist yet. The
`--pass-with-no-tests` flag is required here because Playwright normally exits with `No tests found` before the first
test file exists.

- [ ] **Step 4: Commit config and ignore changes**

Run:

```bash
git add playwright.config.ts .gitignore
git commit -m "test: configure playwright"
```

Expected: a commit is created with `playwright.config.ts` and `.gitignore`.

### Task 5: Add E2E Support Helpers and OpenSpec Folder Guidance

**Files:**
- Create: `e2e/support/routes.ts`
- Create: `e2e/support/test.ts`
- Create: `e2e/specs/README.md`

- [ ] **Step 1: Create `e2e/support/routes.ts`**

```ts
export const routes = {
  home: "/",
  login: "/auth/login",
} as const;
```

- [ ] **Step 2: Create `e2e/support/test.ts`**

```ts
import { expect, test as base } from "@playwright/test";

const isFirstPartyResponse = (responseUrl: string, baseURL: string | undefined): boolean => {
  if (!baseURL) return false;

  try {
    return new URL(responseUrl).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
};

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    page.on("response", (response) => {
      if (
        response.status() >= 500 &&
        isFirstPartyResponse(response.url(), testInfo.project.use.baseURL)
      ) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await use(page);

    expect(pageErrors, "uncaught page errors").toEqual([]);
    expect(serverErrors, "first-party server errors").toEqual([]);
  },
});

export { expect };
```

- [ ] **Step 3: Create `e2e/specs/README.md`**

````md
# OpenSpec-backed E2E Tests

OpenSpec requirements are the source of intent for durable E2E scenarios.

Use this mapping:

- OpenSpec capability: `openspec/specs/<capability>/spec.md`
- E2E folder: `e2e/specs/<capability>/`
- Test file: one focused behavior area per `*.spec.ts`

Example:

```text
openspec/specs/workspace-onboarding-guard/spec.md
e2e/specs/workspace-onboarding-guard/zero-workspace-user.spec.ts
```

Write test titles so they name the requirement or scenario they cover. Keep smoke tests in
`e2e/smoke/`; this folder is for requirement-backed coverage.
````

- [ ] **Step 4: Verify TypeScript can parse the support files**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: command exits successfully.

- [ ] **Step 5: Commit support helpers and OpenSpec guidance**

Run:

```bash
git add e2e/support/routes.ts e2e/support/test.ts e2e/specs/README.md
git commit -m "test: add e2e support structure"
```

Expected: a commit is created with only the new `e2e/support/` files and `e2e/specs/README.md`.

### Task 6: Add the First Public UI Smoke Test

**Files:**
- Create: `e2e/smoke/app-ui.smoke.spec.ts`

- [ ] **Step 1: Create `e2e/smoke/app-ui.smoke.spec.ts`**

```ts
import { expect, test } from "../support/test";
import { routes } from "../support/routes";

test.describe("public UI smoke", () => {
  test("renders the public home page and login page", async ({ page }) => {
    await page.goto(routes.home);

    await expect(
      page.getByRole("heading", {
        name: /Workspace collaboration for|Совместная работа в workspace для/i,
      })
    ).toBeVisible();
    await expect(page.getByText("Next.js 16")).toBeVisible();

    const getStartedLink = page.getByRole("link", { name: /Get Started|Начать/i }).first();

    if ((await getStartedLink.count()) > 0) {
      await getStartedLink.click();
    } else {
      await page.goto(routes.login);
    }

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/Welcome back|С возвращением/i)).toBeVisible();
    await expect(
      page.getByText(/Login with your social account|Войдите через социальный аккаунт/i)
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Run only the smoke test**

Run:

```bash
npm run e2e -- e2e/smoke/app-ui.smoke.spec.ts --project=chromium
```

Expected: Playwright starts or reuses the local Next.js dev server and reports one passing test.

If this fails because PostgreSQL or required local environment variables are unavailable, capture the exact failing line
and continue with the static verification steps in Task 7.

- [ ] **Step 3: Commit the smoke test**

Run:

```bash
git add e2e/smoke/app-ui.smoke.spec.ts
git commit -m "test: add public ui smoke test"
```

Expected: a commit is created with only `e2e/smoke/app-ui.smoke.spec.ts`.

### Task 7: Final Verification

**Files:**
- Read: `package.json`
- Read: `.agents/mcp/mcp.json`
- Read: `playwright.config.ts`
- Read: `e2e/smoke/app-ui.smoke.spec.ts`

- [ ] **Step 1: Run the E2E suite**

Run:

```bash
npm run e2e
```

Expected: Playwright reports the Chromium project passing the public UI smoke test.

If the local database is unavailable, expected failure text should identify the database connection failure during
`npm run dev` or first page render. Do not claim browser verification passed in that case.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: ESLint exits successfully.

- [ ] **Step 3: Confirm generated artifacts are ignored**

Run:

```bash
git status --short
```

Expected: no `playwright-report`, `test-results`, or `blob-report` entries appear. Only intentional source changes
should be visible.

- [ ] **Step 4: Review final diff**

Run:

```bash
git log --oneline -5
git status --short
```

Expected: recent commits include the Playwright dependency, MCP, config, support, and smoke-test commits. Working tree
is clean after all intended commits.
