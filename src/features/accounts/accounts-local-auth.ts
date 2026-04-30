import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

export const LOCAL_AUTOMATION_AUTH_ENV_KEY = "LOCAL_AUTOMATION_AUTH_ENABLED";
export const LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN = "local-agent.test";
export const LOCAL_AUTOMATION_AUTH_EMAIL_PREFIX = "local-agent+";
export const LOCAL_AUTOMATION_AUTH_CLEANUP_PATH = "/api/local-auth/scenario";

export type LocalAutomationCredentials = {
  name: string;
  email: string;
  password: string;
};

export type LocalAutomationScenarioResponse = {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified?: boolean;
      image?: string | null;
    };
    email: string;
    password: string;
    cleanupUrl: string;
  };
};

export type LocalAutomationErrorResponse = {
  success: false;
  error: {
    message: string;
    code: number;
  };
};

export const isLocalAutomationAuthEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env[LOCAL_AUTOMATION_AUTH_ENV_KEY] === "true";

const normalizeSeed = (seed: string) =>
  seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const buildLocalAutomationEmail = (seed: string) => {
  const normalizedSeed = normalizeSeed(seed) || randomUUID().replace(/-/g, "").slice(0, 16);
  return `${LOCAL_AUTOMATION_AUTH_EMAIL_PREFIX}${normalizedSeed}@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`;
};

export const isLocalAutomationEmail = (email?: string | null) => {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  return (
    normalizedEmail.startsWith(LOCAL_AUTOMATION_AUTH_EMAIL_PREFIX) &&
    normalizedEmail.endsWith(`@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`)
  );
};

export const generateLocalAutomationCredentials = (): LocalAutomationCredentials => {
  const seed = randomUUID().replace(/-/g, "").slice(0, 16);

  return {
    name: `Local Automation ${seed}`,
    email: buildLocalAutomationEmail(seed),
    password: `local-${randomBytes(24).toString("base64url")}`,
  };
};
