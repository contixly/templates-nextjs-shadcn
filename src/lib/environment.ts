import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { isProduction } from "better-auth";

const DEFAULT_DEVELOPMENT_BASE_URL = "http://localhost:3000";

const normalizeBaseUrl = (value: string) => {
  const url = new URL(value);
  return url.toString().replace(/\/$/, "");
};

const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? process.env.BETTER_AUTH_URL;

if (isProduction && !configuredBaseUrl) {
  throw new Error("NEXT_PUBLIC_APP_BASE_URL must be configured in production.");
}

export const REMOTE_CACHING_ENABLED = process.env.REMOTE_CACHING_ENABLED ?? false;
export const REDIS_URL = process.env.REDIS_URL ?? null;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? null;

if (REMOTE_CACHING_ENABLED && !REDIS_URL) {
  throw new Error("REDIS_URL must be configured when REMOTE_CACHING_ENABLED is true.");
}

export const APP_BASE_URL = normalizeBaseUrl(configuredBaseUrl ?? DEFAULT_DEVELOPMENT_BASE_URL);
export const APP_BASE_DOMAIN = new URL(APP_BASE_URL).host;

export const APP_LS_PREFIX = "template-app";
export const APP_COOKIE_PREFIX = "acc";

export const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_COUNTER_ID;

export const LAST_LOGIN_METHOD_KEY = `${APP_COOKIE_PREFIX}.last_login_method`;
export const SIDEBAR_COOKIE_KEY = `sidebar_state`;

export const DEFAULT_COOKIE_OPTIONS: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export const BOT_AGENTS =
  /facebookexternalhit|TelegramBot|Twitterbot|LinkedInBot|WhatsApp|vkShare|Slackbot|yandex-images/i;
