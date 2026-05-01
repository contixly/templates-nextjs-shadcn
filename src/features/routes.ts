import application, { ApplicationRoutes } from "@features/application/application-routes";
import dashboard, { DashboardRoutes } from "@features/dashboard/dashboard-routes";
import workspaces, { WorkspaceRoutes } from "@features/workspaces/workspaces-routes";
import accounts, { AccountsRoutes } from "@features/accounts/accounts-routes";

/**
 * Interface representing the application routes structure.
 * It organizes the routes into different category-based groups
 * for better modularity and management of the application routing system.
 */
export type AppRoutes = Readonly<{
  application: ApplicationRoutes;
  workspaces: WorkspaceRoutes;
  dashboard: DashboardRoutes;
  accounts: AccountsRoutes;
}>;

/**
 * Defines the main routes for the application.
 *
 * Keep this module stateless: caching the assembled routes object on `global`
 * can preserve stale path templates across dev hot reloads.
 */
const routes: AppRoutes = {
  application,
  workspaces,
  dashboard,
  accounts,
};

export const routesConfig = {
  publicStaticRoute: [
    "(.*)/favicon.ico(.*)",
    "/robots.txt",
    "/sitemap.xml",
    "(.*)/icon(.*)",
    "(.*)/apple-icon(.*)",
    "(.*)/twitter-image(.*)",
    "(.*)/opengraph-image(.*)",
    "/.well-known/(.*)",
  ],
  publicRoutes: [
    application.pages.home.pathTemplate,
    accounts.pages.login.pathTemplate,
    accounts.pages.error.pathTemplate,
  ],
  publicApiRoute: ["/api/auth/(.*)", "/api/health(.*)", "/api/local-auth/(.*)"],
  // Protected API routes EXCLUDING public API routes
  protectedApiRoute: [
    "/api((?!/auth/)(?!/health).)*", // Match /api/* but exclude /api/auth/* and /api/health*
  ],
};

export default routes;
