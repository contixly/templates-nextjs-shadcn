/** @jest-environment node */

const verifyApiKeyMock = jest.fn();

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      verifyApiKey: (...args: unknown[]) => verifyApiKeyMock(...args),
    },
  },
}));

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    member: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@features/api-keys/api-keys-logger", () => ({
  apiKeysLogger: {
    child: jest.fn(() => ({
      error: jest.fn(),
    })),
  },
}));

import { requireApiKey } from "@features/api-keys/api-keys-auth";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";

const requestWithKey = (key?: string) =>
  new Request("http://localhost:3000/api/v1/me", {
    headers: key ? { "x-api-key": key } : {},
  });

describe("requireApiKey", () => {
  beforeEach(() => {
    verifyApiKeyMock.mockReset();
  });

  it("rejects missing API keys", async () => {
    await expect(
      requireApiKey(requestWithKey(), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 401,
      code: "api_key_missing",
    });
    expect(verifyApiKeyMock).not.toHaveBeenCalled();
  });

  it("maps a verified user key principal", async () => {
    verifyApiKeyMock.mockResolvedValueOnce({
      valid: true,
      key: {
        id: "key_1",
        start: "user_s",
        configId: "user-keys",
        referenceId: "user_1",
        permissions: { basic: ["read"] },
      },
    });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).resolves.toEqual({
      type: "user",
      keyId: "key_1",
      keyStart: "user_s",
      configId: "user-keys",
      userId: "user_1",
      permissions: { basic: ["read"] },
    });
    expect(verifyApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "user-keys",
        key: "secret",
        permissions: { basic: ["read"] },
      },
    });
  });

  it("maps a verified organization key principal after the user config misses", async () => {
    verifyApiKeyMock
      .mockResolvedValueOnce({
        valid: false,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
        key: null,
      })
      .mockResolvedValueOnce({
        valid: true,
        key: {
          id: "key_2",
          start: "org_s",
          configId: "org-keys",
          referenceId: "org_1",
          permissions: { organization: ["read"] },
        },
      });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.organizationRead)
    ).resolves.toMatchObject({
      type: "organization",
      organizationId: "org_1",
      configId: "org-keys",
    });
  });

  it("returns permission denied when any config reports missing permissions", async () => {
    verifyApiKeyMock
      .mockResolvedValueOnce({
        valid: false,
        error: { code: "KEY_NOT_FOUND", message: "Key not found" },
        key: null,
      })
      .mockResolvedValueOnce({
        valid: false,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
        key: null,
      });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.organizationMembersRead)
    ).rejects.toMatchObject({
      status: 403,
      code: "api_key_permission_denied",
    });
  });
});
