/** @jest-environment node */

const isLocalAutomationAuthEnabledMock = jest.fn();
const isLocalAutomationEmailMock = jest.fn();
const generateLocalAutomationCredentialsMock = jest.fn();
const findSoleMemberOrganizationIdsForUserMock = jest.fn();
const deleteSoleMemberOrganizationsForUserMock = jest.fn();
const authHandlerMock = jest.fn();
const getSessionMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@features/accounts/accounts-local-auth", () => ({
  LOCAL_AUTOMATION_AUTH_CLEANUP_PATH: "/api/local-auth/scenario",
  isLocalAutomationAuthEnabled: (...args: unknown[]) => isLocalAutomationAuthEnabledMock(...args),
  isLocalAutomationEmail: (...args: unknown[]) => isLocalAutomationEmailMock(...args),
  generateLocalAutomationCredentials: (...args: unknown[]) =>
    generateLocalAutomationCredentialsMock(...args),
}));

jest.mock("@features/accounts/accounts-local-auth-repository", () => ({
  findSoleMemberOrganizationIdsForUser: (...args: unknown[]) =>
    findSoleMemberOrganizationIdsForUserMock(...args),
  deleteSoleMemberOrganizationsForUser: (...args: unknown[]) =>
    deleteSoleMemberOrganizationsForUserMock(...args),
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

const rawJsonRequest = (method: "POST" | "DELETE", body: string) =>
  new Request("http://localhost:3000/api/local-auth/scenario", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body,
  });

const readJson = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("local automation scenario route", () => {
  beforeEach(() => {
    isLocalAutomationAuthEnabledMock.mockReset();
    isLocalAutomationEmailMock.mockReset();
    generateLocalAutomationCredentialsMock.mockReset();
    findSoleMemberOrganizationIdsForUserMock.mockReset();
    deleteSoleMemberOrganizationsForUserMock.mockReset();
    authHandlerMock.mockReset();
    getSessionMock.mockReset();
    revalidatePathMock.mockReset();

    isLocalAutomationAuthEnabledMock.mockReturnValue(true);
    isLocalAutomationEmailMock.mockImplementation(
      (email: string) =>
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
    deleteSoleMemberOrganizationsForUserMock.mockResolvedValue({ count: 1 });
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

  it("rejects malformed JSON without creating a local automation user", async () => {
    const response = await POST(rawJsonRequest("POST", "{"));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      success: false,
      error: {
        message: "local_automation_invalid_request",
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
    expect(deleteSoleMemberOrganizationsForUserMock).toHaveBeenCalledWith("user_1", ["org_1"]);
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
