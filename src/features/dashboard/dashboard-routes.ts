import { Feature } from "@typings/pages";
import { buildFeature } from "@lib/pages";

type DashboardPages = "application_dashboard";
export type DashboardRoutes = Feature<DashboardPages>;

const dashboardRoutes: DashboardRoutes = buildFeature("dashboard", {
  pages: {
    application_dashboard: {
      pathTemplate: "/dashboard",
      hidePageHeader: true,
      hidePageHeaderOnMobile: true,
    },
  },
});

export default dashboardRoutes;
