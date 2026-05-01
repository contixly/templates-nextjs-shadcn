import { routes } from "./routes";

export const DEFAULT_E2E_ORIGIN = "http://127.0.0.1:3127";
export const E2E_READY_ROUTE = routes.login;
export const E2E_ROUTES_TO_WARM = [routes.home, routes.login] as const;

export const resolveE2EBaseURL = (configuredBaseURL?: string | null) =>
  configuredBaseURL && configuredBaseURL.length > 0
    ? configuredBaseURL
    : process.env.PLAYWRIGHT_BASE_URL || DEFAULT_E2E_ORIGIN;

export const resolveE2EURL = (route: string, baseURL: string) => new URL(route, baseURL).toString();
