# Local Automation Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only Better Auth automation login flow with API creation, UI-assisted login, and authenticated self-cleanup.

**Architecture:** Keep the feature inside the accounts slice. A server-only accounts helper owns the local feature gate, namespace rules, and generated credentials; a small repository owns cleanup queries; one App Router route handler bridges local automation requests to Better Auth so cookies and sessions are real. The login page conditionally renders a client-only local panel as a sibling to the existing OAuth login form.

**Tech Stack:** Next.js 16 App Router route handlers, Better Auth 1.6, Prisma 7, Zod 4, Jest 30, React Testing Library, Tailwind/shadcn UI.

---

## Preflight

The repository requires reading current Next.js docs before coding. Use the checked-in Next.js docs from `node_modules/next/dist/docs/`.

- [ ] **Step 1: Read the relevant Next.js docs**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
sed -n '1,180p' node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
sed -n '1,180p' node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
```

Expected: the docs describe App Router route handlers, `proxy.ts`, and mutation security requirements.

- [ ] **Step 2: Confirm the worktree state**

Run:

```bash
git status --short
```

Expected: no unrelated edits in files this plan will modify. If unrelated edits exist, preserve them and only stage files changed by the current task.

## File Structure

- `src/features/accounts/accounts-local-auth.ts`
  - Server-only feature gate, local email namespace validation, credential generation, and typed response contracts.
- `src/features/accounts/accounts-local-auth-repository.ts`
  - Server-only Prisma cleanup helpers for organizations where the automation user is the sole member.
- `src/app/api/local-auth/scenario/route.ts`
  - Local-only `POST` create/login endpoint and `DELETE` cleanup endpoint.
- `src/server/auth.ts`
  - Enables Better Auth email/password only when the local automation gate is on.
- `src/features/routes.ts`
  - Marks `/api/local-auth/(.*)` as public at the proxy layer; the cleanup route performs its own session check.
- `src/features/accounts/components/forms/local-automation-login-panel.tsx`
  - Client component for the local-only login page panel.
- `src/app/(public)/(simple)/auth/login/page.tsx`
  - Server component that conditionally renders the local panel beside the existing `LoginForm`.
- `AGENTS.md`
  - Short local automation instructions for Playwright, browser-use, and LLM agents.
- `test/features/accounts/local-auth/*.test.ts`
  - Unit tests for helpers, cleanup repository, route behavior, route config, and login page rendering.
- `test/features/accounts/components/local-automation-login-panel.test.tsx`
  - Client behavior tests for the local panel.

### Task 1: Local Gate And Namespace Helper

**Files:**
- Create: `src/features/accounts/accounts-local-auth.ts`
- Create: `test/features/accounts/local-auth/accounts-local-auth.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `test/features/accounts/local-auth/accounts-local-auth.test.ts`:

```ts
/** @jest-environment node */

import {
  LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN,
  buildLocalAutomationEmail,
  generateLocalAutomationCredentials,
  isLocalAutomationAuthEnabled,
  isLocalAutomationEmail,
} from "@features/accounts/accounts-local-auth";

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.LOCAL_AUTOMATION_AUTH_ENABLED;

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
  });
};

describe("accounts local automation auth helper", () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv ?? "test");
    if (originalFlag === undefined) {
      delete process.env.LOCAL_AUTOMATION_AUTH_ENABLED;
    } else {
      process.env.LOCAL_AUTOMATION_AUTH_ENABLED = originalFlag;
    }
  });

  it("enables local automation auth only outside production with the explicit flag", () => {
    setNodeEnv("development");
    process.env.LOCAL_AUTOMATION_AUTH_ENABLED = "true";
    expect(isLocalAutomationAuthEnabled()).toBe(true);

    process.env.LOCAL_AUTOMATION_AUTH_ENABLED = "false";
    expect(isLocalAutomationAuthEnabled()).toBe(false);

    setNodeEnv("production");
    process.env.LOCAL_AUTOMATION_AUTH_ENABLED = "true";
    expect(isLocalAutomationAuthEnabled()).toBe(false);
  });

  it("accepts only generated automation email addresses", () => {
    expect(isLocalAutomationEmail("local-agent+abc123@local-agent.test")).toBe(true);
    expect(isLocalAutomationEmail("LOCAL-AGENT+ABC123@LOCAL-AGENT.TEST")).toBe(true);
    expect(isLocalAutomationEmail("person@example.com")).toBe(false);
    expect(isLocalAutomationEmail("local-agent@local-agent.test")).toBe(false);
    expect(isLocalAutomationEmail("other+abc123@local-agent.test")).toBe(false);
  });

  it("builds deterministic local automation emails from a seed", () => {
    expect(buildLocalAutomationEmail("Run 123")).toBe(
      `local-agent+run-123@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`
    );
  });

  it("generates valid credentials for Better Auth email/password sign-up", () => {
    const credentials = generateLocalAutomationCredentials();

    expect(credentials.name).toMatch(/^Local Automation /);
    expect(isLocalAutomationEmail(credentials.email)).toBe(true);
    expect(credentials.password).toHaveLength(38);
    expect(credentials.password.startsWith("local-")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the helper tests and verify they fail**

Run:

```bash
npm run test -- --testPathPatterns=accounts-local-auth
```

Expected: FAIL because `@features/accounts/accounts-local-auth` does not exist.

- [ ] **Step 3: Implement the server-only helper**

Create `src/features/accounts/accounts-local-auth.ts`:

```ts
import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

export const LOCAL_AUTOMATION_AUTH_ENV_KEY = "LOCAL_AUTOMATION_AUTH_ENABLED";
export const LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN = "local-agent.test";
export const LOCAL_AUTOMATION_AUTH_EMAIL_PREFIX = "local-agent+";
export const LOCAL_AUTOMATION_AUTH_CLEANUP_PATH = "/api/local-auth/scenario";

export type LocalAutomationCredentials = {
  name: string;
  email: string;
  password: string;
};

export type LocalAutomationScenarioResponse = {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified?: boolean;
      image?: string | null;
    };
    email: string;
    password: string;
    cleanupUrl: string;
  };
};

export type LocalAutomationErrorResponse = {
  success: false;
  error: {
    message: string;
    code: number;
  };
};

export const isLocalAutomationAuthEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env[LOCAL_AUTOMATION_AUTH_ENV_KEY] === "true";

const normalizeSeed = (seed: string) =>
  seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const buildLocalAutomationEmail = (seed: string) => {
  const normalizedSeed = normalizeSeed(seed) || randomUUID().replace(/-/g, "").slice(0, 16);
  return `${LOCAL_AUTOMATION_AUTH_EMAIL_PREFIX}${normalizedSeed}@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`;
};

export const isLocalAutomationEmail = (email?: string | null) => {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  return (
    normalizedEmail.startsWith(LOCAL_AUTOMATION_AUTH_EMAIL_PREFIX) &&
    normalizedEmail.endsWith(`@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`)
  );
};

export const generateLocalAutomationCredentials = (): LocalAutomationCredentials => {
  const seed = randomUUID().replace(/-/g, "").slice(0, 16);

  return {
    name: `Local Automation ${seed}`,
    email: buildLocalAutomationEmail(seed),
    password: `local-${randomBytes(24).toString("base64url")}`,
  };
};
```

- [ ] **Step 4: Run the helper tests and verify they pass**

Run:

```bash
npm run test -- --testPathPatterns=accounts-local-auth
```

Expected: PASS for all helper tests.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/features/accounts/accounts-local-auth.ts test/features/accounts/local-auth/accounts-local-auth.test.ts
git commit -m "feat: add local automation auth helper"
```

### Task 2: Cleanup Repository

**Files:**
- Create: `src/features/accounts/accounts-local-auth-repository.ts`
- Create: `test/features/accounts/local-auth/accounts-local-auth-repository.test.ts`

- [ ] **Step 1: Write the failing cleanup repository tests**

Create `test/features/accounts/local-auth/accounts-local-auth-repository.test.ts`:

```ts
/** @jest-environment node */

const organizationFindManyMock = jest.fn();
const organizationDeleteManyMock = jest.fn();

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findMany: (...args: unknown[]) => organizationFindManyMock(...args),
      deleteMany: (...args: unknown[]) => organizationDeleteManyMock(...args),
    },
  },
}));

import {
  deleteOrganizationsByIds,
  findSoleMemberOrganizationIdsForUser,
} from "@features/accounts/accounts-local-auth-repository";

describe("accounts local automation auth repository", () => {
  beforeEach(() => {
    organizationFindManyMock.mockReset();
    organizationDeleteManyMock.mockReset();
  });

  it("finds organizations where the user is the only member", async () => {
    organizationFindManyMock.mockResolvedValue([
      { id: "org_solo", _count: { members: 1 } },
      { id: "org_shared", _count: { members: 2 } },
    ]);

    await expect(findSoleMemberOrganizationIdsForUser("user_1")).resolves.toEqual(["org_solo"]);
    expect(organizationFindManyMock).toHaveBeenCalledWith({
      where: {
        members: {
          some: {
            userId: "user_1",
          },
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  });

  it("deletes organizations by id and skips empty delete batches", async () => {
    organizationDeleteManyMock.mockResolvedValue({ count: 2 });

    await expect(deleteOrganizationsByIds(["org_1", "org_2"])).resolves.toEqual({ count: 2 });
    expect(organizationDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["org_1", "org_2"],
        },
      },
    });

    organizationDeleteManyMock.mockClear();
    await expect(deleteOrganizationsByIds([])).resolves.toEqual({ count: 0 });
    expect(organizationDeleteManyMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the cleanup repository tests and verify they fail**

Run:

```bash
npm run test -- --testPathPatterns=accounts-local-auth-repository
```

Expected: FAIL because `@features/accounts/accounts-local-auth-repository` does not exist.

- [ ] **Step 3: Implement the cleanup repository**

Create `src/features/accounts/accounts-local-auth-repository.ts`:

```ts
import "server-only";

import prisma from "@server/prisma";

export const findSoleMemberOrganizationIdsForUser = async (userId: string) => {
  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return organizations
    .filter((organization) => organization._count.members === 1)
    .map((organization) => organization.id);
};

export const deleteOrganizationsByIds = async (organizationIds: string[]) => {
  if (organizationIds.length === 0) {
    return { count: 0 };
  }

  return prisma.organization.deleteMany({
    where: {
      id: {
        in: organizationIds,
      },
    },
  });
};
```

- [ ] **Step 4: Run the cleanup repository tests and verify they pass**

Run:

```bash
npm run test -- --testPathPatterns=accounts-local-auth-repository
```

Expected: PASS for both repository tests.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/features/accounts/accounts-local-auth-repository.ts test/features/accounts/local-auth/accounts-local-auth-repository.test.ts
git commit -m "feat: add local automation cleanup repository"
```

### Task 3: Auth And Proxy Configuration

**Files:**
- Modify: `src/server/auth.ts`
- Modify: `src/features/routes.ts`
- Create: `test/features/accounts/local-auth/local-auth-route-config.test.ts`

- [ ] **Step 1: Write the failing route config test**

Create `test/features/accounts/local-auth/local-auth-route-config.test.ts`:

```ts
import { routesConfig } from "@features/routes";

describe("local automation auth route config", () => {
  it("keeps local automation auth public at the proxy layer", () => {
    expect(routesConfig.publicApiRoute).toContain("/api/local-auth/(.*)");
  });
});
```

- [ ] **Step 2: Run the route config test and verify it fails**

Run:

```bash
npm run test -- --testPathPatterns=local-auth-route-config
```

Expected: FAIL because `/api/local-auth/(.*)` is not in `routesConfig.publicApiRoute`.

- [ ] **Step 3: Add the proxy public API route**

Modify `src/features/routes.ts`:

```ts
  publicApiRoute: ["/api/auth/(.*)", "/api/health(.*)", "/api/local-auth/(.*)"],
```

This makes unauthenticated `POST /api/local-auth/scenario` reachable. `DELETE /api/local-auth/scenario` still checks the Better Auth session inside the route handler.

- [ ] **Step 4: Enable Better Auth email/password behind the local gate**

Modify `src/server/auth.ts` by adding the helper import:

```ts
import { isLocalAutomationAuthEnabled } from "@features/accounts/accounts-local-auth";
```

Then replace the current `emailAndPassword` block with:

```ts
  emailAndPassword: {
    enabled: isLocalAutomationAuthEnabled(),
    autoSignIn: true,
    requireEmailVerification: false,
  },
```

Expected behavior:

- production: email/password remains disabled
- local without `LOCAL_AUTOMATION_AUTH_ENABLED=true`: email/password remains disabled
- local with `LOCAL_AUTOMATION_AUTH_ENABLED=true`: Better Auth credential sign-up/sign-in endpoints work

- [ ] **Step 5: Run the route config and helper tests**

Run:

```bash
npm run test -- --testPathPatterns='accounts-local-auth|local-auth-route-config'
```

Expected: PASS for helper and route config tests.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/server/auth.ts src/features/routes.ts test/features/accounts/local-auth/local-auth-route-config.test.ts
git commit -m "feat: gate local automation auth"
```

### Task 4: Local Scenario Route Handler

**Files:**
- Create: `src/app/api/local-auth/scenario/route.ts`
- Create: `test/features/accounts/local-auth/local-auth-scenario-route.test.ts`

- [ ] **Step 1: Write failing route handler tests**

Create `test/features/accounts/local-auth/local-auth-scenario-route.test.ts`:

```ts
/** @jest-environment node */

const isLocalAutomationAuthEnabledMock = jest.fn();
const isLocalAutomationEmailMock = jest.fn();
const generateLocalAutomationCredentialsMock = jest.fn();
const findSoleMemberOrganizationIdsForUserMock = jest.fn();
const deleteOrganizationsByIdsMock = jest.fn();
const authHandlerMock = jest.fn();
const getSessionMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@features/accounts/accounts-local-auth", () => ({
  LOCAL_AUTOMATION_AUTH_CLEANUP_PATH: "/api/local-auth/scenario",
  isLocalAutomationAuthEnabled: (...args: unknown[]) =>
    isLocalAutomationAuthEnabledMock(...args),
  isLocalAutomationEmail: (...args: unknown[]) => isLocalAutomationEmailMock(...args),
  generateLocalAutomationCredentials: (...args: unknown[]) =>
    generateLocalAutomationCredentialsMock(...args),
}));

jest.mock("@features/accounts/accounts-local-auth-repository", () => ({
  findSoleMemberOrganizationIdsForUser: (...args: unknown[]) =>
    findSoleMemberOrganizationIdsForUserMock(...args),
  deleteOrganizationsByIds: (...args: unknown[]) => deleteOrganizationsByIdsMock(...args),
}));

jest.mock("@server/auth", () => ({
  auth: {
    handler: (...args: unknown[]) => authHandlerMock(...args),
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

jest.mock("@lib/environment", () => ({
  APP_BASE_URL: "http://localhost:3000",
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { DELETE, POST } from "../../../../src/app/api/local-auth/scenario/route";

const jsonRequest = (method: "POST" | "DELETE", body?: unknown, cookie?: string) =>
  new Request("http://localhost:3000/api/local-auth/scenario", {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const readJson = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("local automation scenario route", () => {
  beforeEach(() => {
    isLocalAutomationAuthEnabledMock.mockReset();
    isLocalAutomationEmailMock.mockReset();
    generateLocalAutomationCredentialsMock.mockReset();
    findSoleMemberOrganizationIdsForUserMock.mockReset();
    deleteOrganizationsByIdsMock.mockReset();
    authHandlerMock.mockReset();
    getSessionMock.mockReset();
    revalidatePathMock.mockReset();

    isLocalAutomationAuthEnabledMock.mockReturnValue(true);
    isLocalAutomationEmailMock.mockImplementation((email: string) =>
      email.toLowerCase().startsWith("local-agent+") && email.endsWith("@local-agent.test")
    );
    generateLocalAutomationCredentialsMock.mockReturnValue({
      name: "Local Automation abc",
      email: "local-agent+abc@local-agent.test",
      password: "local-abcdefghijklmnopqrstuvwxyz123456",
    });
    authHandlerMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "user_1",
            email: "local-agent+abc@local-agent.test",
            name: "Local Automation abc",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "acc.session=token; Path=/; HttpOnly",
          },
        }
      )
    );
    getSessionMock.mockResolvedValue({
      user: {
        id: "user_1",
        email: "local-agent+abc@local-agent.test",
        name: "Local Automation abc",
      },
    });
    findSoleMemberOrganizationIdsForUserMock.mockResolvedValue(["org_1"]);
    deleteOrganizationsByIdsMock.mockResolvedValue({ count: 1 });
  });

  it("returns 404 when the local feature gate is disabled", async () => {
    isLocalAutomationAuthEnabledMock.mockReturnValue(false);

    const response = await POST(jsonRequest("POST"));

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({
      success: false,
      error: {
        message: "local_automation_auth_disabled",
        code: 404,
      },
    });
    expect(authHandlerMock).not.toHaveBeenCalled();
  });

  it("rejects explicit emails outside the automation namespace", async () => {
    const response = await POST(jsonRequest("POST", { email: "person@example.com" }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      success: false,
      error: {
        message: "local_automation_email_required",
        code: 400,
      },
    });
    expect(authHandlerMock).not.toHaveBeenCalled();
  });

  it("creates a Better Auth credential user and preserves the session cookie", async () => {
    const response = await POST(jsonRequest("POST"));

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("acc.session=token");
    expect(authHandlerMock).toHaveBeenCalledTimes(1);

    const authRequest = authHandlerMock.mock.calls[0]?.[0] as Request;
    expect(authRequest.url).toBe("http://localhost:3000/api/auth/sign-up/email");
    expect(authRequest.method).toBe("POST");
    await expect(authRequest.json()).resolves.toEqual({
      name: "Local Automation abc",
      email: "local-agent+abc@local-agent.test",
      password: "local-abcdefghijklmnopqrstuvwxyz123456",
      rememberMe: true,
    });

    expect(await readJson(response)).toEqual({
      success: true,
      data: {
        user: {
          id: "user_1",
          email: "local-agent+abc@local-agent.test",
          name: "Local Automation abc",
        },
        email: "local-agent+abc@local-agent.test",
        password: "local-abcdefghijklmnopqrstuvwxyz123456",
        cleanupUrl: "/api/local-auth/scenario",
      },
    });
  });

  it("returns 409 when an explicit automation email already exists", async () => {
    authHandlerMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "User already exists" }), { status: 422 })
    );

    const response = await POST(
      jsonRequest("POST", {
        email: "local-agent+existing@local-agent.test",
        password: "local-abcdefghijklmnopqrstuvwxyz123456",
      })
    );

    expect(response.status).toBe(409);
    expect(await readJson(response)).toEqual({
      success: false,
      error: {
        message: "local_automation_user_exists",
        code: 409,
      },
    });
  });

  it("requires a Better Auth session for cleanup", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await DELETE(jsonRequest("DELETE"));

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({
      success: false,
      error: {
        message: "local_automation_session_required",
        code: 401,
      },
    });
  });

  it("rejects cleanup for non-automation users", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user_2",
        email: "person@example.com",
        name: "Person",
      },
    });

    const response = await DELETE(jsonRequest("DELETE", undefined, "acc.session=token"));

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({
      success: false,
      error: {
        message: "local_automation_user_required",
        code: 403,
      },
    });
  });

  it("deletes sole-member organizations and then deletes the Better Auth user", async () => {
    authHandlerMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "User deleted" }), {
        status: 200,
        headers: {
          "set-cookie": "acc.session=; Path=/; Max-Age=0",
        },
      })
    );

    const response = await DELETE(jsonRequest("DELETE", undefined, "acc.session=token"));

    expect(findSoleMemberOrganizationIdsForUserMock).toHaveBeenCalledWith("user_1");
    expect(deleteOrganizationsByIdsMock).toHaveBeenCalledWith(["org_1"]);
    expect(authHandlerMock).toHaveBeenCalledTimes(1);

    const authRequest = authHandlerMock.mock.calls[0]?.[0] as Request;
    expect(authRequest.url).toBe("http://localhost:3000/api/auth/delete-user");
    expect(authRequest.method).toBe("POST");
    await expect(authRequest.json()).resolves.toEqual({});

    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await readJson(response)).toEqual({
      success: true,
      data: {
        deletedOrganizations: 1,
      },
    });
  });
});
```

- [ ] **Step 2: Run the route handler tests and verify they fail**

Run:

```bash
npm run test -- --testPathPatterns=local-auth-scenario-route
```

Expected: FAIL because `src/app/api/local-auth/scenario/route.ts` does not exist.

- [ ] **Step 3: Implement the route handler**

Create `src/app/api/local-auth/scenario/route.ts`:

```ts
import {
  LOCAL_AUTOMATION_AUTH_CLEANUP_PATH,
  generateLocalAutomationCredentials,
  isLocalAutomationAuthEnabled,
  isLocalAutomationEmail,
  type LocalAutomationCredentials,
  type LocalAutomationErrorResponse,
  type LocalAutomationScenarioResponse,
} from "@features/accounts/accounts-local-auth";
import {
  deleteOrganizationsByIds,
  findSoleMemberOrganizationIdsForUser,
} from "@features/accounts/accounts-local-auth-repository";
import { APP_BASE_URL } from "@lib/environment";
import { auth } from "@server/auth";
import { HttpCodes } from "@typings/network";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_GENERATED_SIGN_UP_ATTEMPTS = 3;

const scenarioBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().transform((email) => email.trim().toLowerCase()).optional(),
    password: z.string().min(8).max(128).optional(),
    redirect: z.string().max(2048).optional(),
  })
  .strict();

const json = (
  body: LocalAutomationErrorResponse | LocalAutomationScenarioResponse | { success: true; data: unknown },
  status: number,
  headers?: Headers
) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json");

  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
};

const errorJson = (message: string, code: HttpCodes) =>
  json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    code
  );

const readBody = async (request: Request) => {
  const text = await request.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const authHeadersFromRequest = (request: Request) => {
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");

  if (!headers.has("origin")) {
    headers.set("origin", APP_BASE_URL);
  }

  if (!headers.has("referer")) {
    headers.set("referer", `${APP_BASE_URL}/auth/login`);
  }

  return headers;
};

const signUpWithBetterAuth = async (request: Request, credentials: LocalAutomationCredentials) =>
  auth.handler(
    new Request(new URL("/api/auth/sign-up/email", APP_BASE_URL), {
      method: "POST",
      headers: authHeadersFromRequest(request),
      body: JSON.stringify({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
        rememberMe: true,
      }),
    })
  );

const deleteCurrentUserWithBetterAuth = async (request: Request) =>
  auth.handler(
    new Request(new URL("/api/auth/delete-user", APP_BASE_URL), {
      method: "POST",
      headers: authHeadersFromRequest(request),
      body: JSON.stringify({}),
    })
  );

const readResponseJson = async (response: Response) => {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export async function POST(request: Request) {
  if (!isLocalAutomationAuthEnabled()) {
    return errorJson("local_automation_auth_disabled", HttpCodes.NOT_FOUND);
  }

  const body = await readBody(request);
  const parsedBody = scenarioBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return errorJson("local_automation_invalid_request", HttpCodes.BAD_REQUEST);
  }

  if (parsedBody.data.email && !isLocalAutomationEmail(parsedBody.data.email)) {
    return errorJson("local_automation_email_required", HttpCodes.BAD_REQUEST);
  }

  const hasExplicitEmail = Boolean(parsedBody.data.email);
  const attempts = hasExplicitEmail ? 1 : MAX_GENERATED_SIGN_UP_ATTEMPTS;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const generatedCredentials = generateLocalAutomationCredentials();
    const credentials = {
      name: parsedBody.data.name ?? generatedCredentials.name,
      email: parsedBody.data.email ?? generatedCredentials.email,
      password: parsedBody.data.password ?? generatedCredentials.password,
    };

    const authResponse = await signUpWithBetterAuth(request, credentials);
    const authPayload = await readResponseJson(authResponse);

    if (authResponse.ok && typeof authPayload.user === "object" && authPayload.user !== null) {
      return json(
        {
          success: true,
          data: {
            user: authPayload.user as LocalAutomationScenarioResponse["data"]["user"],
            email: credentials.email,
            password: credentials.password,
            cleanupUrl: LOCAL_AUTOMATION_AUTH_CLEANUP_PATH,
          },
        },
        HttpCodes.CREATED,
        authResponse.headers
      );
    }

    if (authResponse.status === 422 && !hasExplicitEmail) {
      continue;
    }

    if (authResponse.status === 422 && hasExplicitEmail) {
      return errorJson("local_automation_user_exists", HttpCodes.CONFLICT);
    }

    return errorJson("local_automation_sign_up_failed", HttpCodes.SERVER_ERROR);
  }

  return errorJson("local_automation_user_exists", HttpCodes.CONFLICT);
}

export async function DELETE(request: Request) {
  if (!isLocalAutomationAuthEnabled()) {
    return errorJson("local_automation_auth_disabled", HttpCodes.NOT_FOUND);
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return errorJson("local_automation_session_required", HttpCodes.UNAUTHORIZED);
  }

  if (!isLocalAutomationEmail(session.user.email)) {
    return errorJson("local_automation_user_required", HttpCodes.FORBIDDEN);
  }

  const organizationIds = await findSoleMemberOrganizationIdsForUser(session.user.id);
  await deleteOrganizationsByIds(organizationIds);

  const authResponse = await deleteCurrentUserWithBetterAuth(request);
  if (!authResponse.ok) {
    return errorJson("local_automation_cleanup_failed", HttpCodes.SERVER_ERROR);
  }

  revalidatePath("/", "layout");

  return json(
    {
      success: true,
      data: {
        deletedOrganizations: organizationIds.length,
      },
    },
    HttpCodes.OK,
    authResponse.headers
  );
}
```

- [ ] **Step 4: Run the route handler tests and verify they pass**

Run:

```bash
npm run test -- --testPathPatterns=local-auth-scenario-route
```

Expected: PASS for all scenario route tests.

- [ ] **Step 5: Run related local-auth tests**

Run:

```bash
npm run test -- --testPathPatterns=local-auth
```

Expected: PASS for helper, repository, route config, and route handler tests.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/app/api/local-auth/scenario/route.ts test/features/accounts/local-auth/local-auth-scenario-route.test.ts
git commit -m "feat: add local automation auth route"
```

### Task 5: Local Login Page Panel

**Files:**
- Create: `src/features/accounts/components/forms/local-automation-login-panel.tsx`
- Modify: `src/app/(public)/(simple)/auth/login/page.tsx`
- Create: `test/features/accounts/components/local-automation-login-panel.test.tsx`
- Create: `test/features/accounts/pages/local-automation-login-page.test.tsx`

- [ ] **Step 1: Write the failing client panel tests**

Create `test/features/accounts/components/local-automation-login-panel.test.tsx`:

```tsx
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const pushMock = jest.fn();
const refreshMock = jest.fn();
const getSearchParamMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: (...args: unknown[]) => getSearchParamMock(...args),
  }),
}));

global.fetch = jest.fn();

import { LocalAutomationLoginPanel } from "@features/accounts/components/forms/local-automation-login-panel";

describe("LocalAutomationLoginPanel", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    getSearchParamMock.mockReset();
    (global.fetch as jest.Mock).mockReset();
    getSearchParamMock.mockReturnValue("/dashboard");
  });

  it("creates a local automation user and redirects to the sanitized redirect path", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user_1",
            email: "local-agent+abc@local-agent.test",
            name: "Local Automation abc",
          },
          email: "local-agent+abc@local-agent.test",
          password: "local-abcdefghijklmnopqrstuvwxyz123456",
          cleanupUrl: "/api/local-auth/scenario",
        },
      }),
    });

    render(<LocalAutomationLoginPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Create local automation user" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/local-auth/scenario", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          redirect: "/dashboard",
        }),
      });
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("renders an error message when local user creation fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          message: "local_automation_sign_up_failed",
          code: 500,
        },
      }),
    });

    render(<LocalAutomationLoginPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Create local automation user" }));

    expect(await screen.findByText("local_automation_sign_up_failed")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write the failing login page rendering tests**

Create `test/features/accounts/pages/local-automation-login-page.test.tsx`:

```tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const isLocalAutomationAuthEnabledMock = jest.fn();

jest.mock("@features/accounts/accounts-local-auth", () => ({
  isLocalAutomationAuthEnabled: () => isLocalAutomationAuthEnabledMock(),
}));

jest.mock("@features/accounts/components/forms/login-form", () => ({
  LoginForm: () => <div data-testid="login-form">OAuth login form</div>,
}));

jest.mock("@features/accounts/components/forms/local-automation-login-panel", () => ({
  LocalAutomationLoginPanel: () => (
    <div data-testid="local-automation-login-panel">Local automation panel</div>
  ),
}));

jest.mock("@lib/cookies", () => ({
  getFromCookie: () => Promise.resolve(null),
}));

jest.mock("@lib/environment", () => ({
  LAST_LOGIN_METHOD_KEY: "acc.last_login_method",
}));

jest.mock("@lib/metadata", () => ({
  SITE_NAME: "Template App",
  buildPageMetadata: jest.fn(async () => ({ title: "Sign In" })),
}));

describe("local automation login page", () => {
  beforeEach(() => {
    isLocalAutomationAuthEnabledMock.mockReset();
  });

  it("renders the local automation panel only when the local gate is enabled", async () => {
    isLocalAutomationAuthEnabledMock.mockReturnValue(true);
    const page = await import("../../../../src/app/(public)/(simple)/auth/login/page");

    render(page.default());

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("local-automation-login-panel")).toBeInTheDocument();
  });

  it("omits the local automation panel when the local gate is disabled", async () => {
    isLocalAutomationAuthEnabledMock.mockReturnValue(false);
    const page = await import("../../../../src/app/(public)/(simple)/auth/login/page");

    render(page.default());

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.queryByTestId("local-automation-login-panel")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the UI tests and verify they fail**

Run:

```bash
npm run test -- --testPathPatterns='local-automation-login-panel|local-automation-login-page'
```

Expected: FAIL because the panel does not exist and the login page does not render it.

- [ ] **Step 4: Implement the client panel**

Create `src/features/accounts/components/forms/local-automation-login-panel.tsx`:

```tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { sanitizeRedirectPath } from "@lib/routes";
import { IconRobot } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

type LocalAutomationPanelState =
  | {
      status: "idle" | "pending";
      error?: null;
    }
  | {
      status: "error";
      error: string;
    };

export const LocalAutomationLoginPanel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeRedirectPath(searchParams.get("redirect") ?? "/dashboard");
  const [state, setState] = useState<LocalAutomationPanelState>({ status: "idle" });

  const createLocalUser = () => {
    startTransition(async () => {
      setState({ status: "pending" });

      try {
        const response = await fetch("/api/local-auth/scenario", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            redirect,
          }),
        });
        const payload = (await response.json()) as {
          success?: boolean;
          error?: {
            message?: string;
          };
        };

        if (!response.ok || !payload.success) {
          setState({
            status: "error",
            error: payload.error?.message ?? "local_automation_sign_up_failed",
          });
          return;
        }

        router.refresh();
        router.push(redirect);
      } catch {
        setState({
          status: "error",
          error: "local_automation_network_error",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-base">Local automation</CardTitle>
        <CardDescription>Create a local Better Auth user for browser testing.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {state.status === "error" && (
          <Alert variant="destructive">
            <AlertTitle>Local auth failed</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button type="button" variant="outline" disabled={state.status === "pending"} onClick={createLocalUser}>
          <IconRobot />
          Create local automation user
        </Button>
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 5: Render the local panel from the login page**

Modify `src/app/(public)/(simple)/auth/login/page.tsx`:

```tsx
import { LocalAutomationLoginPanel } from "@features/accounts/components/forms/local-automation-login-panel";
import { isLocalAutomationAuthEnabled } from "@features/accounts/accounts-local-auth";
```

Then render it as a sibling below `LoginForm`:

```tsx
        <LoginForm getLastLoginPromise={getLastLoginPromise} />
        {isLocalAutomationAuthEnabled() && <LocalAutomationLoginPanel />}
```

- [ ] **Step 6: Run the UI tests and verify they pass**

Run:

```bash
npm run test -- --testPathPatterns='local-automation-login-panel|local-automation-login-page'
```

Expected: PASS for panel behavior and login page rendering.

- [ ] **Step 7: Commit Task 5**

```bash
git add 'src/app/(public)/(simple)/auth/login/page.tsx' src/features/accounts/components/forms/local-automation-login-panel.tsx test/features/accounts/components/local-automation-login-panel.test.tsx test/features/accounts/pages/local-automation-login-page.test.tsx
git commit -m "feat: add local automation login panel"
```

### Task 6: AGENTS.md Instructions

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add the local automation instructions**

Append this section to `AGENTS.md` after the Development Commands or Authentication section:

```markdown
## Local Automation Auth

For local browser automation with Playwright, browser-use, or LLM-driven development agents, enable the local-only Better Auth automation flow:

1. Set `LOCAL_AUTOMATION_AUTH_ENABLED=true` in the local environment. Never enable this flag in production.
2. Start the app with `npm run dev`.
3. From the same browser/API context used by the scenario, create and sign in a new user:

   ```ts
   const response = await page.request.post("/api/local-auth/scenario", {
     data: {},
   });
   const scenario = await response.json();
   ```

4. Use the same browser context to test protected pages. The create response sets the real Better Auth session cookie.
5. Clean up the current automation user and sole-member organizations from the same authenticated context:

   ```ts
   await page.request.delete("/api/local-auth/scenario");
   ```

The endpoint works only when `NODE_ENV !== "production"` and `LOCAL_AUTOMATION_AUTH_ENABLED=true`. Cleanup refuses non-automation users; automation users use the `local-agent+...@local-agent.test` email namespace.
```

- [ ] **Step 2: Verify the docs mention the required launch and cleanup flow**

Run:

```bash
rg -n "Local Automation Auth|LOCAL_AUTOMATION_AUTH_ENABLED|/api/local-auth/scenario|page.request.delete" AGENTS.md
```

Expected: output includes all four search terms.

- [ ] **Step 3: Commit Task 6**

```bash
git add AGENTS.md
git commit -m "docs: document local automation auth"
```

### Task 7: Full Verification

**Files:**
- No new files unless verification reveals a defect.

- [ ] **Step 1: Run all targeted tests**

Run:

```bash
npm run test -- --testPathPatterns='local-auth|local-automation-login-panel|local-automation-login-page'
```

Expected: PASS for all tests added in this plan.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no ESLint or Prettier errors.

- [ ] **Step 3: Run the full Jest suite**

Run:

```bash
npm run test
```

Expected: PASS for the full suite.

- [ ] **Step 4: Start the local app for browser verification**

Run:

```bash
LOCAL_AUTOMATION_AUTH_ENABLED=true npm run dev
```

Expected: Next.js starts successfully and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 5: Verify the API scenario with Playwright or browser-use**

Use the running local app. In Playwright, run:

```ts
const createResponse = await page.request.post("/api/local-auth/scenario", {
  data: {},
});
expect(createResponse.status()).toBe(201);

await page.goto("/dashboard");
await expect(page).not.toHaveURL(/\/auth\/login/);

const cleanupResponse = await page.request.delete("/api/local-auth/scenario");
expect(cleanupResponse.status()).toBe(200);

await page.goto("/dashboard");
await expect(page).toHaveURL(/\/auth\/login/);
```

Expected: create returns `201`, protected navigation works before cleanup, cleanup returns `200`, protected navigation redirects after cleanup.

- [ ] **Step 6: Verify the login page panel in a browser**

Open:

```text
http://localhost:3000/auth/login?redirect=/dashboard
```

Expected:

- the normal OAuth login card is present
- a second `Local automation` card is present
- clicking `Create local automation user` authenticates and navigates to `/dashboard`

- [ ] **Step 7: Stop the dev server**

Stop the foreground process with `Ctrl-C`.

- [ ] **Step 8: Check final git status**

Run:

```bash
git status --short
```

Expected: clean worktree after all task commits.
