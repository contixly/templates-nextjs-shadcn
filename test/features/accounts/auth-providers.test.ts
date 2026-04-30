/** @jest-environment node */

import fs from "node:fs/promises";
import path from "node:path";

const providerEnvKeys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITLAB_CLIENT_ID",
  "GITLAB_CLIENT_SECRET",
  "VK_CLIENT_ID",
  "YANDEX_CLIENT_ID",
  "YANDEX_CLIENT_SECRET",
] as const;

const setProviderEnv = (env: Partial<Record<(typeof providerEnvKeys)[number], string>>) => {
  providerEnvKeys.forEach((key) => {
    delete process.env[key];
  });

  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

describe("configured social auth providers", () => {
  afterEach(() => {
    jest.resetModules();
    providerEnvKeys.forEach((key) => {
      delete process.env[key];
    });
  });

  it("enables only providers whose required env variables are configured", async () => {
    const authTypes = await import("@server/auth/social-providers");

    expect(
      authTypes
        .getConfiguredSocialProviders({
          GOOGLE_CLIENT_ID: "google-client-id",
          GOOGLE_CLIENT_SECRET: "google-client-secret",
          GITHUB_CLIENT_ID: "github-client-id",
          GITLAB_CLIENT_SECRET: "gitlab-client-secret",
          VK_CLIENT_ID: "vk-client-id",
          YANDEX_CLIENT_ID: "   ",
          YANDEX_CLIENT_SECRET: "yandex-client-secret",
        })
        .map((provider) => provider.id)
    ).toEqual(["google", "vk"]);
  });

  it("keeps provider env filtering out of the client-imported auth metadata module", async () => {
    const authTypesSource = await fs.readFile(
      path.join(process.cwd(), "src/types/auth.ts"),
      "utf8"
    );

    expect(authTypesSource).not.toContain("process.env");
    expect(authTypesSource).not.toContain("CLIENT_SECRET");
    expect(authTypesSource).not.toContain("envKeys");
  });

  it("passes only configured providers into Better Auth", async () => {
    const betterAuth = jest.fn((options) => ({ api: {}, options }));
    const genericOAuth = jest.fn((options) => ({ id: "generic-oauth", options }));

    setProviderEnv({
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      VK_CLIENT_ID: "vk-client-id",
      YANDEX_CLIENT_SECRET: "yandex-client-secret",
    });

    jest.doMock("@better-auth/prisma-adapter", () => ({
      prismaAdapter: jest.fn(() => "prisma-adapter"),
    }));
    jest.doMock("@lib/environment", () => ({
      APP_BASE_DOMAIN: "localhost:3000",
      APP_BASE_URL: "http://localhost:3000",
      APP_COOKIE_PREFIX: "acc",
      LAST_LOGIN_METHOD_KEY: "acc.last_login_method",
    }));
    jest.doMock("@server/prisma", () => ({ __esModule: true, default: {} }));
    jest.doMock("better-auth", () => ({ isProduction: false }));
    jest.doMock("better-auth/minimal", () => ({ betterAuth }));
    jest.doMock("better-auth/next-js", () => ({
      nextCookies: jest.fn(() => ({ id: "next-cookies" })),
    }));
    jest.doMock("better-auth/plugins", () => ({
      genericOAuth,
      lastLoginMethod: jest.fn(() => ({ id: "last-login-method" })),
      organization: jest.fn(() => ({ id: "organization" })),
    }));

    await import("@server/auth");

    const authOptions = betterAuth.mock.calls[0][0];

    expect(Object.keys(authOptions.socialProviders)).toEqual(["google", "vk"]);
    expect(authOptions.account.accountLinking.trustedProviders).toEqual(["google", "vk"]);
    expect(genericOAuth).not.toHaveBeenCalled();
  });
});
