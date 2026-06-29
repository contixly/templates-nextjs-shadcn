/** @jest-environment node */

const createApiKeyMock = jest.fn();
const loadCurrentUserIdMock = jest.fn();
const hasWorkspacePermissionMock = jest.fn();
const revalidatePathMock = jest.fn();
const mockApiKeysLoggerChild = jest.fn();
const mockApiKeysLoggerError = jest.fn();

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      createApiKey: (...args: unknown[]) => createApiKeyMock(...args),
    },
  },
}));

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => loadCurrentUserIdMock(...args),
  loadRequestHeaders: jest.fn(),
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

import {
  createApiKeyForCurrentUser,
  type CreateApiKeyInput,
} from "@features/api-keys/actions/create-api-key";

const withCreateDefaults = (
  input: Omit<
    CreateApiKeyInput,
    "expiresIn" | "rateLimitEnabled" | "rateLimitMax" | "rateLimitWindow"
  >
) =>
  ({
    expiresIn: "30d",
    rateLimitEnabled: true,
    rateLimitMax: 100,
    rateLimitWindow: "1h",
    ...input,
  }) satisfies CreateApiKeyInput;

describe("createApiKeyForCurrentUser", () => {
  beforeEach(() => {
    createApiKeyMock.mockReset();
    loadCurrentUserIdMock.mockReset();
    hasWorkspacePermissionMock.mockReset();
    revalidatePathMock.mockReset();
    mockApiKeysLoggerChild.mockReset();
    mockApiKeysLoggerError.mockReset();
    mockApiKeysLoggerChild.mockReturnValue({
      error: mockApiKeysLoggerError,
    });
    loadCurrentUserIdMock.mockResolvedValue("user1");
    hasWorkspacePermissionMock.mockResolvedValue(true);
    createApiKeyMock.mockResolvedValue({
      id: "key1",
      key: "user_secret",
      start: "user_s",
      configId: "user-keys",
      referenceId: "user1",
    });
  });

  it("creates a personal key with expanded allowlisted presets and server fields", async () => {
    await expect(
      createApiKeyForCurrentUser({
        type: "user",
        name: "Local integration",
        presetIds: ["basic-read", "organization-read"],
        expiresIn: "30d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        id: "key1",
        key: "user_secret",
        start: "user_s",
        configId: "user-keys",
        referenceId: "user1",
      },
    });

    expect(createApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "user-keys",
        name: "Local integration",
        userId: "user1",
        permissions: {
          basic: ["read"],
          organization: ["read"],
        },
        expiresIn: 30 * 24 * 60 * 60,
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitTimeWindow: 60 * 60 * 1000,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/user/api-keys");
  });

  it("creates an organization key without passing browser headers", async () => {
    createApiKeyMock.mockResolvedValue({
      id: "key1",
      key: "org_secret",
      start: "org_s",
      configId: "org-keys",
      referenceId: "org1",
    });

    await createApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org1",
      organizationKey: "client-workspace",
      name: "Org integration",
      presetIds: ["organization-read-all"],
      expiresIn: "never",
      rateLimitEnabled: false,
      rateLimitMax: 100,
      rateLimitWindow: "1d",
    });

    expect(hasWorkspacePermissionMock).toHaveBeenCalledWith("org1", { apiKey: ["create"] });
    expect(createApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "org-keys",
        organizationId: "org1",
        name: "Org integration",
        userId: "user1",
        permissions: {
          organization: ["read"],
          member: ["read"],
          team: ["read"],
          teamMember: ["read"],
        },
        expiresIn: null,
        rateLimitEnabled: false,
        rateLimitMax: 100,
        rateLimitTimeWindow: 24 * 60 * 60 * 1000,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/w/client-workspace/settings/api-keys");
  });

  it("rejects organization key creation without apiKey create permission", async () => {
    hasWorkspacePermissionMock.mockResolvedValue(false);

    await expect(
      createApiKeyForCurrentUser({
        type: "organization",
        organizationId: "org1",
        organizationKey: "client-workspace",
        name: "Org integration",
        presetIds: ["organization-read-all"],
        expiresIn: "never",
        rateLimitEnabled: false,
        rateLimitMax: 100,
        rateLimitWindow: "1d",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 403,
        message: "api_keys.permission_denied",
      },
    });

    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects undefined input with a stable request error before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(undefined as never);

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.invalid_request",
      },
    });
    expect(loadCurrentUserIdMock).not.toHaveBeenCalled();
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects null input with a stable request error before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(null as never);

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.invalid_request",
      },
    });
    expect(loadCurrentUserIdMock).not.toHaveBeenCalled();
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects organization key creation without organization id", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "organization",
        name: "Missing org",
        presetIds: ["basic-read"],
      })
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.organization_id_required",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects invalid key type before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "team" as never,
        name: "Bad type",
        presetIds: ["basic-read"],
      }) as never
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.invalid_type",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects invalid names before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "user",
        name: " ",
        presetIds: ["basic-read"],
      })
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.name_required",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects empty preset lists before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "user",
        name: "No scopes",
        presetIds: [],
      })
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.preset_required",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects invalid preset ids before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "user",
        name: "Bad scopes",
        presetIds: ["billing-read" as never],
      }) as never
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.invalid_preset",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects inherited preset names before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "user",
        name: "Bad scopes",
        presetIds: ["toString" as never],
      }) as never
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.invalid_preset",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("rejects empty organization ids before calling Better Auth", async () => {
    const result = await createApiKeyForCurrentUser(
      withCreateDefaults({
        type: "organization",
        organizationId: " ",
        name: "Missing org",
        presetIds: ["basic-read"],
      }) as never
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.invalid_request",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("throws unauthorized before calling Better Auth for anonymous users", async () => {
    loadCurrentUserIdMock.mockResolvedValue(null);

    await expect(
      createApiKeyForCurrentUser({
        type: "user",
        name: "Anonymous key",
        presetIds: ["basic-read"],
        expiresIn: "30d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      })
    ).rejects.toThrow("unauthorized");

    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("returns a stable error when Better Auth rejects key creation", async () => {
    createApiKeyMock.mockRejectedValue(new Error("database connection failed"));

    await expect(
      createApiKeyForCurrentUser({
        type: "user",
        name: "Local integration",
        presetIds: ["basic-read"],
        expiresIn: "30d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 500,
        message: "api_keys.create_failed",
      },
    });

    expect(mockApiKeysLoggerError).toHaveBeenCalledWith({
      error: "database connection failed",
    });
  });

  it("returns a stable error when Better Auth returns a malformed created-key payload", async () => {
    createApiKeyMock.mockResolvedValue({
      id: "key1",
      key: "user_secret",
      start: "user_s",
      configId: "unknown-keys",
      referenceId: "user1",
    });

    await expect(
      createApiKeyForCurrentUser({
        type: "user",
        name: "Local integration",
        presetIds: ["basic-read"],
        expiresIn: "30d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 500,
        message: "api_keys.create_failed",
      },
    });

    expect(mockApiKeysLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "api_keys.created_key_payload_invalid",
      })
    );
  });

  it("returns a stable error when Better Auth returns a mismatched config id", async () => {
    createApiKeyMock.mockResolvedValue({
      id: "key1",
      key: "user_secret",
      start: "user_s",
      configId: "org-keys",
      referenceId: "user1",
    });

    await expect(
      createApiKeyForCurrentUser({
        type: "user",
        name: "Local integration",
        presetIds: ["basic-read"],
        expiresIn: "30d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 500,
        message: "api_keys.create_failed",
      },
    });

    expect(mockApiKeysLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "api_keys.created_key_payload_invalid",
      })
    );
  });

  it("returns a stable error when Better Auth returns a mismatched reference id", async () => {
    createApiKeyMock.mockResolvedValue({
      id: "key1",
      key: "org_secret",
      start: "org_s",
      configId: "org-keys",
      referenceId: "org2",
    });

    await expect(
      createApiKeyForCurrentUser({
        type: "organization",
        organizationId: "org1",
        name: "Org integration",
        presetIds: ["organization-read-all"],
        expiresIn: "30d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 500,
        message: "api_keys.create_failed",
      },
    });

    expect(mockApiKeysLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "api_keys.created_key_payload_invalid",
      })
    );
  });
});
