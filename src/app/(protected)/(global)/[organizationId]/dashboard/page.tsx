import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@lib/metadata";
import dashboardRoutes from "@features/dashboard/dashboard-routes";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { SectionCards } from "@features/dashboard/ui/template/section-cards";
import { ChartAreaInteractive } from "@features/dashboard/ui/template/chart-area-interactive";
import { DataTable } from "@features/dashboard/ui/template/data-table";
import data from "../../dashboard/data.json";

interface OrganizationDashboardPageProps {
  params: Promise<{ organizationId: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationDashboardPageProps): Promise<Metadata> =>
  buildPageMetadata(dashboardRoutes.pages.organization_dashboard, await params);

export default async function OrganizationDashboardPage({
  params,
}: OrganizationDashboardPageProps) {
  const { organizationId } = await params;

  return (
    <OrganizationRouteGuard organizationId={organizationId}>
      <div className="flex flex-col gap-6 py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <Suspense>
          <DataTable data={data} />
        </Suspense>
      </div>
    </OrganizationRouteGuard>
  );
}
