/** @jest-environment node */

const betterAuthMock = jest.fn((options) => ({ api: {}, options }));
const organizationMock = jest.fn((options) => ({ id: "organization", options }));
const apiKeyMock = jest.fn((options) => ({ id: "api-key", options }));
type PermissionMap = Record<string, readonly string[]>;
const createAccessControlMock = jest.fn((statements: PermissionMap) => ({
  statements,
  newRole: (permissions: PermissionMap) => ({
    authorize: (required: PermissionMap) => ({
      success: Object.entries(required).every(([resource, actions]) =>
        actions.every((action) => permissions[resource]?.includes(action))
      ),
    }),
    permissions,
  }),
}));

const loadAuthModule = async () => {
  jest.resetModules();
  betterAuthMock.mockClear();
  organizationMock.mockClear();
  apiKeyMock.mockClear();
  createAccessControlMock.mockClear();

  jest.doMock("@better-auth/prisma-adapter", () => ({
    prismaAdapter: jest.fn(() => "prisma-adapter"),
  }));
  jest.doMock("@features/accounts/accounts-local-auth", () => ({
    isLocalAutomationAuthEnabled: () => false,
  }));
  jest.doMock("@lib/environment", () => ({
    APP_BASE_DOMAIN: "localhost:3000",
    APP_BASE_URL: "http://localhost:3000",
    APP_COOKIE_PREFIX: "acc",
    LAST_LOGIN_METHOD_KEY: "acc.last_login_method",
  }));
  jest.doMock("@server/prisma", () => ({
    __esModule: true,
    default: {},
  }));
  jest.doMock("@server/auth/organization-hooks", () => ({
    betterAuthOrganizationHooks: {},
  }));
  jest.doMock("@server/auth/social-providers", () => ({
    getConfiguredSocialProviderIds: () => [],
  }));
  jest.doMock("@server/auth/yandex-oauth2-client", () => ({
    YandexOAuth2ClientConfig: {},
  }));
  jest.doMock("better-auth", () => ({ isProduction: false }));
  jest.doMock("better-auth/minimal", () => ({ betterAuth: betterAuthMock }));
  jest.doMock("better-auth/next-js", () => ({
    nextCookies: jest.fn(() => ({ id: "next-cookies" })),
  }));
  jest.doMock("better-auth/plugins", () => ({
    createAccessControl: createAccessControlMock,
    genericOAuth: jest.fn((options) => ({ id: "generic-oauth", options })),
    lastLoginMethod: jest.fn(() => ({ id: "last-login-method" })),
    organization: organizationMock,
  }));
  jest.doMock("@better-auth/api-key", () => ({
    apiKey: apiKeyMock,
  }));

  await import("@server/auth");
};

describe("Better Auth API key configuration", () => {
  it("registers user and organization API key configurations", async () => {
    await loadAuthModule();

    expect(apiKeyMock).toHaveBeenCalledWith([
      expect.objectContaining({
        configId: "user-keys",
        references: "user",
        defaultPrefix: "user_",
        apiKeyHeaders: "x-api-key",
      }),
      expect.objectContaining({
        configId: "org-keys",
        references: "organization",
        defaultPrefix: "org_",
        apiKeyHeaders: "x-api-key",
      }),
    ]);
  });

  it("adds apiKey management permissions to organization access control", async () => {
    await loadAuthModule();

    const organizationOptions = organizationMock.mock.calls[0]?.[0];
    expect(organizationOptions.ac.statements.apiKey).toEqual([
      "create",
      "read",
      "update",
      "delete",
    ]);
    expect(
      organizationOptions.roles.owner.authorize({ apiKey: ["create", "read", "update", "delete"] })
        .success
    ).toBe(true);
    expect(
      organizationOptions.roles.admin.authorize({ apiKey: ["create", "read", "update", "delete"] })
        .success
    ).toBe(true);
    expect(organizationOptions.roles.member.authorize({ apiKey: ["create"] }).success).toBe(false);
  });
});
