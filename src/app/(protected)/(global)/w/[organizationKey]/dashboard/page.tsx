import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@lib/metadata";
import dashboardRoutes from "@features/dashboard/dashboard-routes";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { SectionCards } from "@features/dashboard/ui/template/section-cards";
import { ChartAreaInteractive } from "@features/dashboard/ui/template/chart-area-interactive";
import { DataTable } from "@features/dashboard/ui/template/data-table";
import { OrganizationDashboardPageSkeleton } from "@features/dashboard/ui/template/dashboard-page-skeleton";
import data from "../../../dashboard/data.json";

interface OrganizationDashboardPageProps {
  params: Promise<{ organizationKey: string }>;
}

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

export async function OrganizationDashboardContent({ params }: OrganizationDashboardPageProps) {
  const { organizationKey } = await params;

  return (
    <OrganizationRouteGuard organizationKey={organizationKey}>
      <div className="flex flex-col gap-6 py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </OrganizationRouteGuard>
  );
}
