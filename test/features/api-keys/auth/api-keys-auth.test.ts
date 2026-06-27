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

const authError = (code: string) => Object.assign(new Error(code), { code });
const apiError = (code: string) => ({
  name: "APIError",
  body: { code },
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

  it("rejects blank API keys", async () => {
    await expect(
      requireApiKey(requestWithKey("   "), API_KEY_REQUIRED_PERMISSIONS.basicRead)
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
    expect(verifyApiKeyMock).toHaveBeenNthCalledWith(1, {
      body: {
        configId: "user-keys",
        key: "secret",
        permissions: { organization: ["read"] },
      },
    });
    expect(verifyApiKeyMock).toHaveBeenNthCalledWith(2, {
      body: {
        configId: "org-keys",
        key: "secret",
        permissions: { organization: ["read"] },
      },
    });
  });

  it("returns invalid when both configs report invalid API key", async () => {
    verifyApiKeyMock
      .mockResolvedValueOnce({
        valid: false,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
        key: null,
      })
      .mockResolvedValueOnce({
        valid: false,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
        key: null,
      });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 401,
      code: "api_key_invalid",
    });
    expect(verifyApiKeyMock).toHaveBeenNthCalledWith(1, {
      body: {
        configId: "user-keys",
        key: "secret",
        permissions: { basic: ["read"] },
      },
    });
    expect(verifyApiKeyMock).toHaveBeenNthCalledWith(2, {
      body: {
        configId: "org-keys",
        key: "secret",
        permissions: { basic: ["read"] },
      },
    });
  });

  it("returns rate limited when a config reports a rate-limit code", async () => {
    verifyApiKeyMock.mockResolvedValueOnce({
      valid: false,
      error: { code: "RATE_LIMITED", message: "Rate limited" },
      key: null,
    });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 429,
      code: "api_key_rate_limited",
    });
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(1);
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

  it("normalizes thrown invalid key errors and continues to the next config", async () => {
    verifyApiKeyMock.mockRejectedValueOnce(authError("INVALID_API_KEY")).mockResolvedValueOnce({
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
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(2);
  });

  it("normalizes thrown permission errors to permission denied", async () => {
    verifyApiKeyMock
      .mockRejectedValueOnce(authError("INSUFFICIENT_API_KEY_PERMISSIONS"))
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
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(2);
  });

  it("normalizes thrown rate-limit errors immediately", async () => {
    verifyApiKeyMock.mockRejectedValueOnce(authError("RATE_LIMIT_EXCEEDED"));

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 429,
      code: "api_key_rate_limited",
    });
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(1);
  });

  it("normalizes thrown APIError invalid key codes", async () => {
    verifyApiKeyMock
      .mockRejectedValueOnce(apiError("INVALID_API_KEY"))
      .mockRejectedValueOnce(apiError("INVALID_API_KEY"));

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 401,
      code: "api_key_invalid",
    });
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(2);
  });

  it.each(["INSUFFICIENT_API_KEY_PERMISSIONS", "KEY_NOT_FOUND"])(
    "normalizes thrown APIError permission code %s",
    async (code) => {
      verifyApiKeyMock.mockRejectedValueOnce(apiError(code)).mockResolvedValueOnce({
        valid: false,
        error: { code: "INVALID_API_KEY", message: "Invalid API key" },
        key: null,
      });

      await expect(
        requireApiKey(
          requestWithKey("secret"),
          API_KEY_REQUIRED_PERMISSIONS.organizationMembersRead
        )
      ).rejects.toMatchObject({
        status: 403,
        code: "api_key_permission_denied",
      });
      expect(verifyApiKeyMock).toHaveBeenCalledTimes(2);
    }
  );

  it("normalizes thrown APIError rate-limit codes immediately", async () => {
    verifyApiKeyMock.mockRejectedValueOnce(apiError("RATE_LIMITED"));

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 429,
      code: "api_key_rate_limited",
    });
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(1);
  });

  it("rejects valid responses with a mismatched key config", async () => {
    verifyApiKeyMock.mockResolvedValueOnce({
      valid: true,
      key: {
        id: "key_1",
        start: "user_s",
        configId: "org-keys",
        referenceId: "user_1",
        permissions: { basic: ["read"] },
      },
    });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 401,
      code: "api_key_invalid",
    });
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      label: "missing id",
      key: {
        start: "user_s",
        configId: "user-keys",
        referenceId: "user_1",
        permissions: { basic: ["read"] },
      },
    },
    {
      label: "empty id",
      key: {
        id: "",
        start: "user_s",
        configId: "user-keys",
        referenceId: "user_1",
        permissions: { basic: ["read"] },
      },
    },
    {
      label: "missing reference id",
      key: {
        id: "key_1",
        start: "user_s",
        configId: "user-keys",
        permissions: { basic: ["read"] },
      },
    },
    {
      label: "empty reference id",
      key: {
        id: "key_1",
        start: "user_s",
        configId: "user-keys",
        referenceId: "",
        permissions: { basic: ["read"] },
      },
    },
  ])("rejects valid responses with $label", async ({ key }) => {
    verifyApiKeyMock.mockResolvedValueOnce({
      valid: true,
      key,
    });

    await expect(
      requireApiKey(requestWithKey("secret"), API_KEY_REQUIRED_PERMISSIONS.basicRead)
    ).rejects.toMatchObject({
      status: 401,
      code: "api_key_invalid",
    });
    expect(verifyApiKeyMock).toHaveBeenCalledTimes(1);
  });
});
