import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@lib/metadata";
import dashboardRoutes from "@features/dashboard/dashboard-routes";
import { OrganizationDashboardPageSkeleton } from "@features/dashboard/ui/template/dashboard-page-skeleton";
import {
  OrganizationDashboardContent,
  type OrganizationDashboardPageProps,
} from "./organization-dashboard-content";

export const generateMetadata = async ({
  params,
}: OrganizationDashboardPageProps): Promise<Metadata> =>
  buildPageMetadata(dashboardRoutes.pages.organization_dashboard, await params);

export default function OrganizationDashboardPage({ params }: OrganizationDashboardPageProps) {
  return (
    <Suspense fallback={<OrganizationDashboardPageSkeleton />}>
      <OrganizationDashboardContent params={params} />
    </Suspense>
  );
}
