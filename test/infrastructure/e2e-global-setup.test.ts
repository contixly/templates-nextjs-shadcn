/** @jest-environment node */

import { AUTH_DISABLE_SESSION_COOKIE_CACHE_ENV_KEY } from "../../src/server/auth/session-cookie-cache";
import { assertReusableServerSessionCacheEnv } from "../../e2e/support/global-setup";

const buildEnv = (overrides: Record<string, string | undefined> = {}) => ({
  ...overrides,
});

describe("e2e global setup", () => {
  it("requires disabled Better Auth session cookie cache for reused server runs", () => {
    expect(() =>
      assertReusableServerSessionCacheEnv(
        buildEnv({
          PLAYWRIGHT_START_SERVER: "false",
        })
      )
    ).toThrow(
      "PLAYWRIGHT_START_SERVER=false requires AUTH_DISABLE_SESSION_COOKIE_CACHE=true on the Playwright command and the already-running app server."
    );
  });

  it("allows reused server runs when session cookie caching is disabled", () => {
    expect(() =>
      assertReusableServerSessionCacheEnv(
        buildEnv({
          PLAYWRIGHT_START_SERVER: "false",
          [AUTH_DISABLE_SESSION_COOKIE_CACHE_ENV_KEY]: "true",
        })
      )
    ).not.toThrow();
  });

  it("does not require local app server env when Playwright starts the server", () => {
    expect(() =>
      assertReusableServerSessionCacheEnv(
        buildEnv({
          PLAYWRIGHT_START_SERVER: "true",
        })
      )
    ).not.toThrow();
  });
});
