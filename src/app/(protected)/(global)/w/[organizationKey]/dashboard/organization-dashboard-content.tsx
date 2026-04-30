import { SectionCards } from "@features/dashboard/ui/template/section-cards";
import { ChartAreaInteractive } from "@features/dashboard/ui/template/chart-area-interactive";
import { DataTable } from "@features/dashboard/ui/template/data-table";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import data from "../../../dashboard/data.json";

export interface OrganizationDashboardPageProps {
  params: Promise<{ organizationKey: string }>;
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
