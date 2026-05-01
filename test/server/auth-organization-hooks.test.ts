/** @jest-environment node */

const betterAuthMock = jest.fn((options) => ({ api: {}, options }));
const genericOAuthMock = jest.fn((options) => ({ id: "generic-oauth", options }));
const organizationMock = jest.fn((options) => ({ id: "organization", options }));
const teamFindManyMock = jest.fn();

class MockAPIError extends Error {
  status: string;
  body?: { message?: string };

  constructor(status: string, body?: { message?: string }) {
    super(body?.message ?? status);
    this.status = status;
    this.body = body;
  }
}

const loadOrganizationHooks = async () => {
  jest.resetModules();
  betterAuthMock.mockClear();
  genericOAuthMock.mockClear();
  organizationMock.mockClear();
  teamFindManyMock.mockReset();

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
    default: {
      team: {
        findMany: (...args: unknown[]) => teamFindManyMock(...args),
      },
    },
  }));
  jest.doMock("better-auth", () => ({ isProduction: false }));
  jest.doMock("better-auth/api", () => ({ APIError: MockAPIError }));
  jest.doMock("better-auth/minimal", () => ({ betterAuth: betterAuthMock }));
  jest.doMock("better-auth/next-js", () => ({
    nextCookies: jest.fn(() => ({ id: "next-cookies" })),
  }));
  jest.doMock("better-auth/plugins", () => ({
    genericOAuth: genericOAuthMock,
    lastLoginMethod: jest.fn(() => ({ id: "last-login-method" })),
    organization: organizationMock,
  }));

  await import("@server/auth");

  return organizationMock.mock.calls[0]?.[0]?.organizationHooks;
};

const organization = {
  id: "org1",
  name: "Acme",
  slug: "acme",
  metadata: {
    allowedEmailDomains: ["example.com"],
  },
};

const inviter = {
  id: "user1",
  email: "owner@example.com",
  emailVerified: true,
  name: "Owner",
};

describe("Better Auth organization hooks", () => {
  it("rejects raw invitation creation outside workspace domain policy", async () => {
    const hooks = await loadOrganizationHooks();
    const beforeCreateInvitation = hooks?.beforeCreateInvitation;

    expect(beforeCreateInvitation).toEqual(expect.any(Function));

    await expect(
      beforeCreateInvitation?.({
        invitation: {
          organizationId: "org1",
          inviterId: "user1",
          email: "person@outside.test",
          role: "member",
        },
        inviter,
        organization,
      })
    ).rejects.toMatchObject({
      status: "BAD_REQUEST",
      body: { message: "validation.errors.invitationDomainRestricted" },
    });
  });

  it("rejects raw invitation acceptance when current workspace domain policy disallows the recipient", async () => {
    const hooks = await loadOrganizationHooks();
    const beforeAcceptInvitation = hooks?.beforeAcceptInvitation;

    expect(beforeAcceptInvitation).toEqual(expect.any(Function));

    await expect(
      beforeAcceptInvitation?.({
        invitation: {
          id: "invite1",
          organizationId: "org1",
          email: "person@outside.test",
          role: "member",
          status: "pending",
          expiresAt: new Date("2026-05-10T10:00:00.000Z"),
          inviterId: "user1",
        },
        user: {
          id: "user2",
          email: "person@outside.test",
          emailVerified: true,
          name: "Recipient",
        },
        organization,
      })
    ).rejects.toMatchObject({
      status: "BAD_REQUEST",
      body: { message: "validation.errors.invitationDomainRestricted" },
    });
  });

  it("rejects raw invitation creation when any team id is outside the organization", async () => {
    const hooks = await loadOrganizationHooks();
    const beforeCreateInvitation = hooks?.beforeCreateInvitation;

    expect(beforeCreateInvitation).toEqual(expect.any(Function));
    teamFindManyMock.mockResolvedValue([{ id: "team1" }]);

    await expect(
      beforeCreateInvitation?.({
        invitation: {
          organizationId: "org1",
          inviterId: "user1",
          email: "person@example.com",
          role: "member",
          teamId: "team1",
          teamIds: ["team1", "team-outside"],
        },
        inviter,
        organization,
      })
    ).rejects.toMatchObject({
      status: "BAD_REQUEST",
      body: { message: "validation.errors.invitationTeamInvalid" },
    });

    expect(teamFindManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["team1", "team-outside"],
        },
        organizationId: "org1",
      },
      select: {
        id: true,
      },
    });
  });

  it("allows raw invitation creation when domain and team policy are satisfied", async () => {
    const hooks = await loadOrganizationHooks();
    const beforeCreateInvitation = hooks?.beforeCreateInvitation;

    expect(beforeCreateInvitation).toEqual(expect.any(Function));
    teamFindManyMock.mockResolvedValue([{ id: "team1" }, { id: "team2" }]);

    await expect(
      beforeCreateInvitation?.({
        invitation: {
          organizationId: "org1",
          inviterId: "user1",
          email: "person@example.com",
          role: "member",
          teamId: "team1",
          teamIds: ["team1", "team2"],
        },
        inviter,
        organization,
      })
    ).resolves.toBeUndefined();
  });

  it("rejects raw invitation acceptance when persisted team ids are outside the organization", async () => {
    const hooks = await loadOrganizationHooks();
    const beforeAcceptInvitation = hooks?.beforeAcceptInvitation;

    expect(beforeAcceptInvitation).toEqual(expect.any(Function));
    teamFindManyMock.mockResolvedValue([{ id: "team1" }]);

    await expect(
      beforeAcceptInvitation?.({
        invitation: {
          id: "invite1",
          organizationId: "org1",
          email: "person@example.com",
          role: "member",
          status: "pending",
          expiresAt: new Date("2026-05-10T10:00:00.000Z"),
          inviterId: "user1",
          teamId: "team1,team-outside",
        },
        user: {
          id: "user2",
          email: "person@example.com",
          emailVerified: true,
          name: "Recipient",
        },
        organization,
      })
    ).rejects.toMatchObject({
      status: "BAD_REQUEST",
      body: { message: "validation.errors.invitationTeamInvalid" },
    });
  });
});
