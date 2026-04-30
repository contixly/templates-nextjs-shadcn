import { redirect } from "next/navigation";
import routes from "@features/routes";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";

export interface WorkspacePageProps {
  params: Promise<{ organizationKey: string }>;
}

const OrganizationDashboardRedirect = ({
  organization,
}: {
  organization: { id: string; slug?: string | null };
}) =>
  redirect(
    routes.dashboard.pages.organization_dashboard.path({
      organizationKey: getOrganizationRouteKey(organization),
    })
  );

export async function WorkspacePageRedirectContent({ params }: WorkspacePageProps) {
  const { organizationKey } = await params;

  return (
    <OrganizationRouteGuard organizationKey={organizationKey}>
      {(organization) => <OrganizationDashboardRedirect organization={organization} />}
    </OrganizationRouteGuard>
  );
}
