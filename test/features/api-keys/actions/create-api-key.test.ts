/** @jest-environment node */

const createApiKeyMock = jest.fn();
const loadCurrentUserIdMock = jest.fn();

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

jest.mock("next/navigation", () => ({
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import { createApiKeyForCurrentUser } from "@features/api-keys/actions/create-api-key";

describe("createApiKeyForCurrentUser", () => {
  beforeEach(() => {
    createApiKeyMock.mockReset();
    loadCurrentUserIdMock.mockReset();
    loadCurrentUserIdMock.mockResolvedValue("user_1");
    createApiKeyMock.mockResolvedValue({
      id: "key_1",
      key: "user_secret",
      start: "user_s",
      configId: "user-keys",
      referenceId: "user_1",
    });
  });

  it("creates a personal key with expanded allowlisted presets", async () => {
    await expect(
      createApiKeyForCurrentUser({
        type: "user",
        name: "Local integration",
        presetIds: ["basic-read", "organization-read"],
      })
    ).resolves.toEqual({
      success: true,
      data: {
        id: "key_1",
        key: "user_secret",
        start: "user_s",
        configId: "user-keys",
        referenceId: "user_1",
      },
    });

    expect(createApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "user-keys",
        name: "Local integration",
        userId: "user_1",
        permissions: {
          basic: ["read"],
          organization: ["read"],
        },
      },
    });
  });

  it("creates an organization key without passing browser headers", async () => {
    await createApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org_1",
      name: "Org integration",
      presetIds: ["organization-read-all"],
    });

    expect(createApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "org-keys",
        organizationId: "org_1",
        name: "Org integration",
        userId: "user_1",
        permissions: {
          organization: ["read"],
          member: ["read"],
          team: ["read"],
          teamMember: ["read"],
        },
      },
    });
  });

  it("rejects organization key creation without organization id", async () => {
    const result = await createApiKeyForCurrentUser({
      type: "organization",
      name: "Missing org",
      presetIds: ["basic-read"],
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: 400,
        message: "api_keys.organization_id_required",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });
});
