/** @jest-environment node */

const getSessionMock = jest.fn();
const listUserAccountsMock = jest.fn();
const listSessionsMock = jest.fn();
const sessionFindManyMock = jest.fn();
const headersMock = jest.fn();

const originalDisableSessionCookieCache = process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;

const loadAccountsActionsModule = async () => {
  jest.resetModules();
  getSessionMock.mockReset();
  listUserAccountsMock.mockReset();
  listSessionsMock.mockReset();
  sessionFindManyMock.mockReset();
  headersMock.mockReset();

  jest.doMock("@server/auth", () => ({
    auth: {
      api: {
        getSession: (...args: unknown[]) => getSessionMock(...args),
        listUserAccounts: (...args: unknown[]) => listUserAccountsMock(...args),
        listSessions: (...args: unknown[]) => listSessionsMock(...args),
      },
    },
  }));
  jest.doMock("next/headers", () => ({
    headers: (...args: unknown[]) => headersMock(...args),
  }));
  jest.doMock("@server/prisma", () => ({
    __esModule: true,
    default: {
      session: {
        findMany: (...args: unknown[]) => sessionFindManyMock(...args),
      },
    },
  }));

  return import("@features/accounts/accounts-actions");
};

const restoreDisableSessionCookieCacheEnv = () => {
  if (originalDisableSessionCookieCache === undefined) {
    delete process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;
    return;
  }

  process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE = originalDisableSessionCookieCache;
};

describe("account session loaders", () => {
  afterEach(() => {
    restoreDisableSessionCookieCacheEnv();
    jest.dontMock("@server/auth");
    jest.dontMock("next/headers");
  });

  it("uses the Better Auth session cookie cache by default", async () => {
    delete process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;
    const { loadCurrentUserId } = await loadAccountsActionsModule();
    const requestHeaders = new Headers([["cookie", "session=1"]]);
    headersMock.mockResolvedValue(requestHeaders);
    getSessionMock.mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "session-123" },
    });

    await expect(loadCurrentUserId()).resolves.toBe("user-123");
    expect(getSessionMock).toHaveBeenCalledWith({
      headers: requestHeaders,
    });
  });

  it("can bypass the Better Auth session cookie cache through server env", async () => {
    process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE = "true";
    const { loadCurrentUserId } = await loadAccountsActionsModule();
    const requestHeaders = new Headers([["cookie", "session=1"]]);
    headersMock.mockResolvedValue(requestHeaders);
    getSessionMock.mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "session-123" },
    });

    await expect(loadCurrentUserId()).resolves.toBe("user-123");
    expect(getSessionMock).toHaveBeenCalledWith({
      headers: requestHeaders,
      query: {
        disableCookieCache: true,
      },
    });
  });

  it("lists active sessions when the current session is valid but no longer fresh", async () => {
    const { loadCurrentUserSessionList } = await loadAccountsActionsModule();
    const requestHeaders = new Headers([["cookie", "session=1"]]);
    const currentSession = {
      id: "session-current",
      userId: "user-123",
      token: "current-token",
      expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-25T00:00:00.000Z"),
      ipAddress: "192.0.2.1",
      userAgent: "Current Browser",
    };
    const otherSession = {
      id: "session-other",
      userId: "user-123",
      token: "other-token",
      expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      createdAt: new Date("2026-08-24T00:00:00.000Z"),
      updatedAt: new Date("2026-08-26T00:00:00.000Z"),
      ipAddress: "192.0.2.2",
      userAgent: "Other Browser",
    };

    headersMock.mockResolvedValue(requestHeaders);
    getSessionMock.mockResolvedValue({
      user: { id: "user-123" },
      session: currentSession,
    });
    listSessionsMock.mockRejectedValue(
      Object.assign(new Error("Session is not fresh"), { code: "SESSION_NOT_FRESH" })
    );
    sessionFindManyMock.mockResolvedValue([currentSession, otherSession]);

    await expect(loadCurrentUserSessionList()).resolves.toEqual([
      {
        id: "session-other",
        expiresAt: otherSession.expiresAt,
        createdAt: otherSession.createdAt,
        updatedAt: otherSession.updatedAt,
        ipAddress: otherSession.ipAddress,
        userAgent: otherSession.userAgent,
        isCurrent: false,
      },
      {
        id: "session-current",
        expiresAt: currentSession.expiresAt,
        createdAt: currentSession.createdAt,
        updatedAt: currentSession.updatedAt,
        ipAddress: currentSession.ipAddress,
        userAgent: currentSession.userAgent,
        isCurrent: true,
      },
    ]);
    expect(sessionFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-123",
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });
    expect(listSessionsMock).not.toHaveBeenCalled();
  });
});

export {};
