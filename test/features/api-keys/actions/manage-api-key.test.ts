/** @jest-environment node */

const updateApiKeyMock = jest.fn();
const deleteApiKeyMock = jest.fn();
const loadCurrentUserIdMock = jest.fn();
const loadRequestHeadersMock = jest.fn();
const hasWorkspacePermissionMock = jest.fn();
const revalidatePathMock = jest.fn();
const mockApiKeysLoggerChild = jest.fn();
const mockApiKeysLoggerError = jest.fn();

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      updateApiKey: (...args: unknown[]) => updateApiKeyMock(...args),
      deleteApiKey: (...args: unknown[]) => deleteApiKeyMock(...args),
    },
  },
}));

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => loadCurrentUserIdMock(...args),
  loadRequestHeaders: (...args: unknown[]) => loadRequestHeadersMock(...args),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => hasWorkspacePermissionMock(...args),
}));

jest.mock("@features/api-keys/api-keys-logger", () => ({
  apiKeysLogger: {
    child: (...args: unknown[]) => mockApiKeysLoggerChild(...args),
  },
}));

jest.mock("next/navigation", () => ({
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { deleteApiKeyForCurrentUser } from "@features/api-keys/actions/delete-api-key";
import { updateApiKeyForCurrentUser } from "@features/api-keys/actions/update-api-key";

describe("API key management actions", () => {
  beforeEach(() => {
    updateApiKeyMock.mockReset();
    deleteApiKeyMock.mockReset();
    loadCurrentUserIdMock.mockReset();
    loadRequestHeadersMock.mockReset();
    hasWorkspacePermissionMock.mockReset();
    revalidatePathMock.mockReset();
    mockApiKeysLoggerChild.mockReset();
    mockApiKeysLoggerError.mockReset();
    mockApiKeysLoggerChild.mockReturnValue({
      error: mockApiKeysLoggerError,
    });
    loadCurrentUserIdMock.mockResolvedValue("user1");
    loadRequestHeadersMock.mockResolvedValue(new Headers([["x-test", "1"]]));
    hasWorkspacePermissionMock.mockResolvedValue(true);
    updateApiKeyMock.mockResolvedValue({
      id: "key1",
      configId: "user-keys",
      referenceId: "user1",
      name: "Renamed",
      start: "user_abcd",
      prefix: "user_",
      enabled: true,
      permissions: { basic: ["read"] },
      rateLimitEnabled: true,
      rateLimitTimeWindow: 60_000,
      rateLimitMax: 50,
      requestCount: 0,
      remaining: null,
      lastRequest: null,
      expiresAt: null,
      createdAt: new Date("2026-06-29T00:00:00.000Z"),
      updatedAt: new Date("2026-06-29T00:00:00.000Z"),
      metadata: null,
    });
    deleteApiKeyMock.mockResolvedValue({ success: true });
  });

  it("updates a personal key with server-only fields", async () => {
    await expect(
      updateApiKeyForCurrentUser({
        type: "user",
        keyId: "key1",
        name: "Renamed",
        presetIds: ["basic-read"],
        expiresIn: "7d",
        rateLimitEnabled: true,
        rateLimitMax: 50,
        rateLimitWindow: "1m",
      })
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: "key1",
        name: "Renamed",
        configId: "user-keys",
        referenceId: "user1",
        permissions: { basic: ["read"] },
      }),
    });

    expect(updateApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "user-keys",
        keyId: "key1",
        userId: "user1",
        name: "Renamed",
        permissions: { basic: ["read"] },
        expiresIn: 7 * 24 * 60 * 60,
        rateLimitEnabled: true,
        rateLimitMax: 50,
        rateLimitTimeWindow: 60 * 1000,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/user/api-keys");
  });

  it("checks organization update permission before updating an organization key", async () => {
    updateApiKeyMock.mockResolvedValue({
      id: "key1",
      configId: "org-keys",
      referenceId: "org1",
      name: "Org key",
      start: "org_abcd",
      prefix: "org_",
      enabled: false,
      permissions: { organization: ["read"] },
      rateLimitEnabled: false,
      rateLimitTimeWindow: null,
      rateLimitMax: null,
      requestCount: 0,
      remaining: null,
      lastRequest: null,
      expiresAt: null,
      createdAt: new Date("2026-06-29T00:00:00.000Z"),
      updatedAt: new Date("2026-06-29T00:00:00.000Z"),
      metadata: null,
    });

    await updateApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org1",
      organizationKey: "client-workspace",
      keyId: "key1",
      enabled: false,
    });

    expect(hasWorkspacePermissionMock).toHaveBeenCalledWith("org1", { apiKey: ["update"] });
    expect(updateApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "org-keys",
        keyId: "key1",
        userId: "user1",
        enabled: false,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/w/client-workspace/settings/api-keys");
  });

  it("rejects organization update without apiKey update permission", async () => {
    hasWorkspacePermissionMock.mockResolvedValue(false);

    await expect(
      updateApiKeyForCurrentUser({
        type: "organization",
        organizationId: "org1",
        organizationKey: "client-workspace",
        keyId: "key1",
        enabled: false,
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 403,
        message: "api_keys.permission_denied",
      },
    });

    expect(updateApiKeyMock).not.toHaveBeenCalled();
  });

  it("deletes a personal key", async () => {
    await expect(
      deleteApiKeyForCurrentUser({
        type: "user",
        keyId: "key1",
      })
    ).resolves.toEqual({ success: true });

    expect(deleteApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "user-keys",
        keyId: "key1",
      },
      headers: expect.any(Headers),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/user/api-keys");
  });

  it("checks organization delete permission before deleting an organization key", async () => {
    await deleteApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org1",
      organizationKey: "client-workspace",
      keyId: "key1",
    });

    expect(hasWorkspacePermissionMock).toHaveBeenCalledWith("org1", { apiKey: ["delete"] });
    expect(deleteApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "org-keys",
        keyId: "key1",
      },
      headers: expect.any(Headers),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/w/client-workspace/settings/api-keys");
  });

  it("rejects organization delete without apiKey delete permission", async () => {
    hasWorkspacePermissionMock.mockResolvedValue(false);

    await expect(
      deleteApiKeyForCurrentUser({
        type: "organization",
        organizationId: "org1",
        organizationKey: "client-workspace",
        keyId: "key1",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 403,
        message: "api_keys.permission_denied",
      },
    });

    expect(deleteApiKeyMock).not.toHaveBeenCalled();
  });
});
