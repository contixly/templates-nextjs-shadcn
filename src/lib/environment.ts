import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { isProduction } from "better-auth";

export const APP_BASE_DOMAIN = isProduction ? "example.com" : "localhost:3000";
export const APP_BASE_URL = `http${isProduction ? "s" : ""}://${APP_BASE_DOMAIN}`;

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
