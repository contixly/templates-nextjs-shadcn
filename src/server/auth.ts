import "server-only";

import { betterAuth } from "better-auth/minimal";
import { genericOAuth, lastLoginMethod, organization } from "better-auth/plugins";
import prisma from "@server/prisma";
import { APP_BASE_DOMAIN, APP_COOKIE_PREFIX, LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import { nextCookies } from "better-auth/next-js";
import { BetterAuthOptions } from "@better-auth/core";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { BetterAuthAdvancedOptions, isProduction } from "better-auth";
import { socialsProviders } from "@typings/auth";
import { YandexOAuth2ClientConfig } from "@server/auth/yandex-oauth2-client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
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
      schema: {
        session: {
          fields: {
            activeOrganizationId: "activeOrganizationId",
          },
        },
        organization: {
          additionalFields: {
            isDefault: {
              type: "boolean",
              required: false,
              defaultValue: false,
            },
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
    allowedHosts: [process.env.BETTER_AUTH_URL, APP_BASE_DOMAIN, `*.${APP_BASE_DOMAIN}`],
    protocol: isProduction ? "https" : "http",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL],
} as BetterAuthOptions);
