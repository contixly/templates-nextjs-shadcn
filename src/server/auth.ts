import "server-only";

import { betterAuth } from "better-auth/minimal";
import { genericOAuth, lastLoginMethod, organization } from "better-auth/plugins";
import prisma from "@server/prisma";
import {
  APP_BASE_DOMAIN,
  APP_BASE_URL,
  APP_COOKIE_PREFIX,
  LAST_LOGIN_METHOD_KEY,
} from "@lib/environment";
import { isLocalAutomationAuthEnabled } from "@features/accounts/accounts-local-auth";
import { nextCookies } from "better-auth/next-js";
import { BetterAuthOptions } from "@better-auth/core";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { BetterAuthAdvancedOptions, isProduction } from "better-auth";
import { socialsProviders } from "@typings/auth";
import { YandexOAuth2ClientConfig } from "@server/auth/yandex-oauth2-client";

type BetterAuthApiMethod = (...args: unknown[]) => Promise<unknown>;

const getConfiguredHost = (value?: string | null) => {
  if (!value) return null;

  try {
    return new URL(value).host;
  } catch {
    return null;
  }
};

const betterAuthAllowedHosts = Array.from(
  new Set(
    [
      APP_BASE_DOMAIN,
      `*.${APP_BASE_DOMAIN}`,
      getConfiguredHost(process.env.BETTER_AUTH_URL),
    ].filter(Boolean) as string[]
  )
);

const betterAuthTrustedOrigins = Array.from(
  new Set([APP_BASE_URL, process.env.BETTER_AUTH_URL].filter(Boolean) as string[])
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: isLocalAutomationAuthEnabled(),
    autoSignIn: true,
    requireEmailVerification: false,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: false,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: true,
      updateUserInfoOnLink: true,
      allowUnlinkingAll: false,
      trustedProviders: socialsProviders.map((provider) => provider.id),
    },
  },
  socialProviders: {
    google: {
      prompt: isProduction ? "select_account" : undefined,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      prompt: isProduction ? "select_account" : undefined,
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    gitlab: {
      prompt: isProduction ? "select_account" : undefined,
      clientId: process.env.GITLAB_CLIENT_ID as string,
      clientSecret: process.env.GITLAB_CLIENT_SECRET as string,
    },
    vk: {
      clientId: process.env.VK_CLIENT_ID as string,
    },
  },
  plugins: [
    nextCookies(),
    lastLoginMethod({
      cookieName: LAST_LOGIN_METHOD_KEY,
    }),
    organization({
      requireEmailVerificationOnInvitation: true,
      teams: {
        enabled: true,
        defaultTeam: {
          enabled: false,
        },
        allowRemovingAllTeams: true,
      },
      schema: {
        session: {
          fields: {
            activeOrganizationId: "activeOrganizationId",
            activeTeamId: "activeTeamId",
          },
        },
      },
    }),
    genericOAuth({
      config: [YandexOAuth2ClientConfig],
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: isProduction ? 5 * 60 : 60 * 60,
      strategy: "jwt", // compact" or "jwt" or "jwe"
    },
  },
  advanced: {
    cookiePrefix: APP_COOKIE_PREFIX,
  } as BetterAuthAdvancedOptions,
  baseURL: {
    allowedHosts: betterAuthAllowedHosts,
    protocol: isProduction ? "https" : "http",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: betterAuthTrustedOrigins,
} as BetterAuthOptions) as ReturnType<typeof betterAuth> & {
  api: Record<string, BetterAuthApiMethod>;
};
