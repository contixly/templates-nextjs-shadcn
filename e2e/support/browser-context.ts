import type { Browser, BrowserContextOptions } from "@playwright/test";
import { resolveE2EBaseURL } from "./config";

export const createE2EBrowserContext = (
  browser: Browser,
  configuredBaseURL?: string | null,
  options: BrowserContextOptions = {}
) =>
  browser.newContext({
    ...options,
    baseURL: options.baseURL ?? resolveE2EBaseURL(configuredBaseURL),
  });
