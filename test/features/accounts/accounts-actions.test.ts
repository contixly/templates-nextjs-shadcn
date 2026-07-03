/** @jest-environment node */

const getSessionMock = jest.fn();
const listUserAccountsMock = jest.fn();
const listSessionsMock = jest.fn();
const headersMock = jest.fn();

const originalDisableSessionCookieCache = process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;

const loadAccountsActionsModule = async () => {
  jest.resetModules();
  getSessionMock.mockReset();
  listUserAccountsMock.mockReset();
  listSessionsMock.mockReset();
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
});

export {};
