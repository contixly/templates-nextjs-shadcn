import type { FullConfig } from "@playwright/test";

const DEFAULT_BASE_URL = "http://127.0.0.1:3127";
const ROUTES_TO_WARM = ["/", "/auth/login"] as const;
const READY_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 500;
const ROUTE_SETTLE_DELAY_MS = 2_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveBaseURL = (config: FullConfig) => {
  const configuredBaseURL = config.projects[0]?.use.baseURL;

  return typeof configuredBaseURL === "string" && configuredBaseURL.length > 0
    ? configuredBaseURL
    : DEFAULT_BASE_URL;
};

const waitForRoute = async (baseURL: string, route: string) => {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  const url = new URL(route, baseURL).toString();
  let lastStatus: number | undefined;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      lastStatus = response.status;

      if (response.status === 200) {
        await response.arrayBuffer();
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(RETRY_DELAY_MS);
  }

  throw new Error(
    `Timed out waiting for ${url} to return 200. Last status: ${
      lastStatus ?? "none"
    }. Last error: ${lastError instanceof Error ? lastError.message : String(lastError ?? "none")}`
  );
};

export default async function globalSetup(config: FullConfig) {
  const baseURL = resolveBaseURL(config);

  for (const [index, route] of ROUTES_TO_WARM.entries()) {
    if (index > 0) await delay(ROUTE_SETTLE_DELAY_MS);

    await waitForRoute(baseURL, route);
  }
}
