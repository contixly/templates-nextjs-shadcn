import { Feature } from "@typings/pages";
import { buildFeature } from "@lib/pages";
import { GlobalOpenGraph } from "@lib/metadata";

type DashboardPages = "application_dashboard";
export type DashboardRoutes = Feature<DashboardPages>;

const dashboardRoutes: DashboardRoutes = buildFeature("dashboard", {
  pages: {
    application_dashboard: {
      pathTemplate: "/dashboard",
      hidePageHeader: true,
      hidePageHeaderOnMobile: true,

      title: "Dashboard",
      description:
        "Your dashboard — extend this area with summaries and shortcuts for your own workflows.",
      openGraph: {
        ...GlobalOpenGraph,
        title: "Dashboard",
        description: "View your application data and manage core sections in one place.",
      },
    },
  },
});

export default dashboardRoutes;
