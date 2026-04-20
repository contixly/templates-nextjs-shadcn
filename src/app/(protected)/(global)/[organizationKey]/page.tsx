import { redirect } from "next/navigation";
import routes from "@features/routes";
import type { Metadata } from "next";
import { buildPageMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";

interface WorkspacePageProps {
  params: Promise<{ organizationKey: string }>;
}

const OrganizationDashboardRedirect = ({
  organization,
}: {
  organization: { id: string; slug?: string | null };
}) => {
  redirect(
    routes.dashboard.pages.organization_dashboard.path({
      organizationKey: getOrganizationRouteKey(organization),
    })
  );
};

export const generateMetadata = async ({ params }: WorkspacePageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.workspace, await params);

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { organizationKey } = await params;

  return (
    <OrganizationRouteGuard organizationKey={organizationKey}>
      {(organization) => <OrganizationDashboardRedirect organization={organization} />}
    </OrganizationRouteGuard>
  );
}
