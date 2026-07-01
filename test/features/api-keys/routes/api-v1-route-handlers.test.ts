/** @jest-environment node */

const requireApiKeyMock = jest.fn();
const requireApiOrganizationAccessMock = jest.fn();
const findManyAccessibleOrganizationsByUserIdMock = jest.fn();
const findOrganizationDtoByIdMock = jest.fn();
const findManyOrganizationMembersByOrganizationIdMock = jest.fn();
const findManyWorkspaceTeamsByOrganizationIdMock = jest.fn();
const findWorkspaceTeamByIdAndOrganizationIdMock = jest.fn();
const findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock = jest.fn();

jest.mock("@features/api-keys/api-keys-auth", () => ({
  requireApiKey: (...args: unknown[]) => requireApiKeyMock(...args),
  requireApiOrganizationAccess: (...args: unknown[]) => requireApiOrganizationAccessMock(...args),
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  findManyAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    findManyAccessibleOrganizationsByUserIdMock(...args),
  findOrganizationDtoById: (...args: unknown[]) => findOrganizationDtoByIdMock(...args),
  findManyOrganizationMembersByOrganizationId: (...args: unknown[]) =>
    findManyOrganizationMembersByOrganizationIdMock(...args),
}));

jest.mock("@features/workspaces/workspaces-teams-repository", () => ({
  findManyWorkspaceTeamsByOrganizationId: (...args: unknown[]) =>
    findManyWorkspaceTeamsByOrganizationIdMock(...args),
  findWorkspaceTeamByIdAndOrganizationId: (...args: unknown[]) =>
    findWorkspaceTeamByIdAndOrganizationIdMock(...args),
  findManyWorkspaceTeamMembersByTeamIdAndOrganizationId: (...args: unknown[]) =>
    findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock(...args),
}));

jest.mock("@features/api-keys/api-keys-logger", () => ({
  apiKeysLogger: {
    child: jest.fn(() => ({
      error: jest.fn(),
    })),
  },
}));

import { ApiKeyHttpError } from "@features/api-keys/api-keys-errors";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";

const request = () =>
  new Request("http://localhost:3000/api/v1/organizations/org_1", {
    headers: { "x-api-key": "secret" },
  });

const expectRequireApiKeyCall = (
  callIndex: number,
  apiRequest: Request,
  expectedPermissions: (typeof API_KEY_REQUIRED_PERMISSIONS)[keyof typeof API_KEY_REQUIRED_PERMISSIONS]
) => {
  const call = requireApiKeyMock.mock.calls[callIndex];

  expect(call).toBeDefined();
  expect(call[0]).toBe(apiRequest);
  expect(call[1]).toBe(expectedPermissions);
};

const rejectOrganizationAccess = () => {
  requireApiOrganizationAccessMock.mockRejectedValue(
    new ApiKeyHttpError(403, "organization_access_denied", "Organization access denied")
  );
};

const expectOrganizationAccessDeniedResponse = async (response: Response) => {
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "organization_access_denied",
      message: "Organization access denied",
    },
  });
};

describe("/api/v1 route handlers", () => {
  beforeEach(() => {
    requireApiKeyMock.mockReset();
    requireApiOrganizationAccessMock.mockReset();
    findManyAccessibleOrganizationsByUserIdMock.mockReset();
    findOrganizationDtoByIdMock.mockReset();
    findManyOrganizationMembersByOrganizationIdMock.mockReset();
    findManyWorkspaceTeamsByOrganizationIdMock.mockReset();
    findWorkspaceTeamByIdAndOrganizationIdMock.mockReset();
    findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock.mockReset();
    requireApiOrganizationAccessMock.mockResolvedValue({ organizationId: "org_1" });
  });

  it("returns user principal metadata from /me", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "user",
      keyId: "key_1",
      keyStart: "user_s",
      configId: "user-keys",
      userId: "user_1",
      permissions: { basic: ["read"] },
    });

    const route = await import("../../../../src/app/api/v1/me/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest);

    expect(response.status).toBe(200);
    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.basicRead);
    await expect(response.json()).resolves.toEqual({
      data: {
        principal: {
          type: "user",
          userId: "user_1",
          organizationId: null,
        },
        key: {
          id: "key_1",
          start: "user_s",
          configId: "user-keys",
        },
        permissions: { basic: ["read"] },
      },
    });
  });

  it("lists organizations differently for user and organization keys", async () => {
    requireApiKeyMock.mockResolvedValueOnce({
      type: "user",
      keyId: "key_1",
      keyStart: "user_s",
      configId: "user-keys",
      userId: "user_1",
      permissions: { organization: ["read"] },
    });
    findManyAccessibleOrganizationsByUserIdMock.mockResolvedValue([{ id: "org_1", name: "Acme" }]);

    const route = await import("../../../../src/app/api/v1/organizations/route");
    const userRequest = request();
    const userResponse = await route.GET(userRequest);

    expectRequireApiKeyCall(0, userRequest, API_KEY_REQUIRED_PERMISSIONS.organizationRead);
    await expect(userResponse.json()).resolves.toEqual({
      data: [{ id: "org_1", name: "Acme" }],
    });

    requireApiKeyMock.mockResolvedValueOnce({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_2",
      permissions: { organization: ["read"] },
    });
    findOrganizationDtoByIdMock.mockResolvedValue({ id: "org_2", name: "Beta" });

    const orgRequest = request();
    const orgResponse = await route.GET(orgRequest);

    expectRequireApiKeyCall(1, orgRequest, API_KEY_REQUIRED_PERMISSIONS.organizationRead);
    await expect(orgResponse.json()).resolves.toEqual({
      data: [{ id: "org_2", name: "Beta" }],
    });
  });

  it("returns not found when an organization-key list scope is missing", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_2",
      permissions: { organization: ["read"] },
    });
    findOrganizationDtoByIdMock.mockResolvedValue(null);

    const route = await import("../../../../src/app/api/v1/organizations/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest);

    expect(response.status).toBe(404);
    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationRead);
    expect(findManyAccessibleOrganizationsByUserIdMock).not.toHaveBeenCalled();
    expect(findOrganizationDtoByIdMock).toHaveBeenCalledWith("org_2");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "resource_not_found",
        message: "Resource not found",
      },
    });
  });

  it("returns organization details after resolving organization scope", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "user",
      keyId: "key_1",
      keyStart: "user_s",
      configId: "user-keys",
      userId: "user_1",
      permissions: { organization: ["read"] },
    });
    findOrganizationDtoByIdMock.mockResolvedValue({ id: "org_1", name: "Acme" });

    const route = await import("../../../../src/app/api/v1/organizations/[organizationId]/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationRead);
    expect(requireApiOrganizationAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "user" }),
      "org_1"
    );
    await expect(response.json()).resolves.toEqual({
      data: { id: "org_1", name: "Acme" },
    });
  });

  it("skips organization detail lookup when organization access is denied", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "user",
      keyId: "key_1",
      keyStart: "user_s",
      configId: "user-keys",
      userId: "user_1",
      permissions: { organization: ["read"] },
    });
    rejectOrganizationAccess();

    const route = await import("../../../../src/app/api/v1/organizations/[organizationId]/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationRead);
    expect(requireApiOrganizationAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "user" }),
      "org_1"
    );
    expect(findOrganizationDtoByIdMock).not.toHaveBeenCalled();
    await expectOrganizationAccessDeniedResponse(response);
  });

  it("returns organization members after resolving organization scope", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], member: ["read"] },
    });
    findOrganizationDtoByIdMock.mockResolvedValue({ id: "org_1", name: "Acme" });
    findManyOrganizationMembersByOrganizationIdMock.mockResolvedValue([{ id: "member_1" }]);

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/members/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationMembersRead);
    expect(requireApiOrganizationAccessMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "organization" }),
      "org_1"
    );
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "member_1" }],
    });
  });

  it("skips organization member lookups when organization access is denied", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], member: ["read"] },
    });
    rejectOrganizationAccess();

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/members/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationMembersRead);
    expect(findOrganizationDtoByIdMock).not.toHaveBeenCalled();
    expect(findManyOrganizationMembersByOrganizationIdMock).not.toHaveBeenCalled();
    await expectOrganizationAccessDeniedResponse(response);
  });

  it("returns organization teams after resolving organization scope", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], team: ["read"] },
    });
    findOrganizationDtoByIdMock.mockResolvedValue({ id: "org_1", name: "Acme" });
    findManyWorkspaceTeamsByOrganizationIdMock.mockResolvedValue([{ id: "team_1" }]);

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/teams/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationTeamsRead);
    expect(findManyWorkspaceTeamsByOrganizationIdMock).toHaveBeenCalledWith("org_1");
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "team_1" }],
    });
  });

  it("skips organization team lookups when organization access is denied", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], team: ["read"] },
    });
    rejectOrganizationAccess();

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/teams/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expectRequireApiKeyCall(0, apiRequest, API_KEY_REQUIRED_PERMISSIONS.organizationTeamsRead);
    expect(findOrganizationDtoByIdMock).not.toHaveBeenCalled();
    expect(findManyWorkspaceTeamsByOrganizationIdMock).not.toHaveBeenCalled();
    await expectOrganizationAccessDeniedResponse(response);
  });

  it("returns team members after resolving organization scope and team ownership", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], team: ["read"], teamMember: ["read"] },
    });
    findWorkspaceTeamByIdAndOrganizationIdMock.mockResolvedValue({ id: "team_1" });
    findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock.mockResolvedValue([
      { id: "team_member_1" },
    ]);

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/teams/[teamId]/members/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1", teamId: "team_1" }),
    });

    expectRequireApiKeyCall(
      0,
      apiRequest,
      API_KEY_REQUIRED_PERMISSIONS.organizationTeamMembersRead
    );
    expect(findWorkspaceTeamByIdAndOrganizationIdMock).toHaveBeenCalledWith("team_1", "org_1");
    expect(findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock).toHaveBeenCalledWith(
      "team_1",
      "org_1"
    );
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "team_member_1" }],
    });
  });

  it("skips team member lookups when organization access is denied", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], team: ["read"], teamMember: ["read"] },
    });
    rejectOrganizationAccess();

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/teams/[teamId]/members/route");
    const apiRequest = request();
    const response = await route.GET(apiRequest, {
      params: Promise.resolve({ organizationId: "org_1", teamId: "team_1" }),
    });

    expectRequireApiKeyCall(
      0,
      apiRequest,
      API_KEY_REQUIRED_PERMISSIONS.organizationTeamMembersRead
    );
    expect(findWorkspaceTeamByIdAndOrganizationIdMock).not.toHaveBeenCalled();
    expect(findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock).not.toHaveBeenCalled();
    await expectOrganizationAccessDeniedResponse(response);
  });

  it("returns not found when an organization-scoped resource is missing", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], member: ["read"] },
    });
    findOrganizationDtoByIdMock.mockResolvedValue(null);

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/members/route");
    const response = await route.GET(request(), {
      params: Promise.resolve({ organizationId: "org_1" }),
    });

    expect(response.status).toBe(404);
    expect(findManyOrganizationMembersByOrganizationIdMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "resource_not_found",
        message: "Resource not found",
      },
    });
  });

  it("returns not found when a team is outside the organization", async () => {
    requireApiKeyMock.mockResolvedValue({
      type: "organization",
      keyId: "key_2",
      keyStart: "org_s",
      configId: "org-keys",
      organizationId: "org_1",
      permissions: { organization: ["read"], team: ["read"], teamMember: ["read"] },
    });
    findWorkspaceTeamByIdAndOrganizationIdMock.mockResolvedValue(null);

    const route =
      await import("../../../../src/app/api/v1/organizations/[organizationId]/teams/[teamId]/members/route");
    const response = await route.GET(request(), {
      params: Promise.resolve({ organizationId: "org_1", teamId: "team_2" }),
    });

    expect(response.status).toBe(404);
    expect(findManyWorkspaceTeamMembersByTeamIdAndOrganizationIdMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "resource_not_found",
        message: "Resource not found",
      },
    });
  });

  it("returns JSON errors from route handlers", async () => {
    requireApiKeyMock.mockRejectedValue(
      new ApiKeyHttpError(403, "api_key_permission_denied", "API key permission denied")
    );

    const route = await import("../../../../src/app/api/v1/me/route");
    const response = await route.GET(request());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "api_key_permission_denied",
        message: "API key permission denied",
      },
    });
  });
});
