import { createRouteMatcher } from "@lib/clerk/routes";
import { routesConfig } from "@features/routes";

const requestFor = (pathname: string) =>
  ({ nextUrl: { pathname } }) as Parameters<ReturnType<typeof createRouteMatcher>>[0];

describe("/api/v1 route config", () => {
  it("lets API v1 route handlers own API key authentication", () => {
    expect(routesConfig.publicApiRoute).toContain("/api/v1/(.*)");
  });

  it("does not classify API v1 routes as protected session API routes", () => {
    const isPublicApiRoute = createRouteMatcher(routesConfig.publicApiRoute);
    const isProtectedApiRoute = createRouteMatcher(routesConfig.protectedApiRoute);

    expect(isPublicApiRoute(requestFor("/api/v1/me"))).toBe(true);
    expect(isProtectedApiRoute(requestFor("/api/v1"))).toBe(false);
    expect(isProtectedApiRoute(requestFor("/api/v1/me"))).toBe(false);
    expect(isProtectedApiRoute(requestFor("/api/v10/me"))).toBe(true);
    expect(isProtectedApiRoute(requestFor("/api/workspaces"))).toBe(true);
  });
});
