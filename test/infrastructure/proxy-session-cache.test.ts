/** @jest-environment node */

import { NextRequest } from "next/server";

const getSessionMock = jest.fn();
const originalDisableSessionCookieCache = process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;

const loadProxyModule = async () => {
  jest.resetModules();
  getSessionMock.mockReset();

  jest.doMock("@server/auth", () => ({
    auth: {
      api: {
        getSession: (...args: unknown[]) => getSessionMock(...args),
      },
    },
  }));
  jest.doMock("@lib/routes", () => ({
    detectOGBots: () => false,
    sanitizeRedirectPath: (path: string) => path,
  }));

  return import("../../src/proxy");
};

const restoreDisableSessionCookieCacheEnv = () => {
  if (originalDisableSessionCookieCache === undefined) {
    delete process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;
    return;
  }

  process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE = originalDisableSessionCookieCache;
};

describe("proxy session cookie cache", () => {
  afterEach(() => {
    restoreDisableSessionCookieCacheEnv();
    jest.dontMock("@server/auth");
    jest.dontMock("@lib/routes");
  });

  it("uses the Better Auth session cookie cache by default for protected routes", async () => {
    delete process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE;
    const { default: proxy } = await loadProxyModule();
    const request = new NextRequest("http://localhost/dashboard");
    getSessionMock.mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "session-123" },
    });

    await proxy(request);

    expect(getSessionMock).toHaveBeenCalledWith({
      headers: request.headers,
    });
  });

  it("can bypass the Better Auth session cookie cache through server env", async () => {
    process.env.AUTH_DISABLE_SESSION_COOKIE_CACHE = "true";
    const { default: proxy } = await loadProxyModule();
    const request = new NextRequest("http://localhost/dashboard");
    getSessionMock.mockResolvedValue({
      user: { id: "user-123" },
      session: { id: "session-123" },
    });

    await proxy(request);

    expect(getSessionMock).toHaveBeenCalledWith({
      headers: request.headers,
      query: {
        disableCookieCache: true,
      },
    });
  });
});

export {};
