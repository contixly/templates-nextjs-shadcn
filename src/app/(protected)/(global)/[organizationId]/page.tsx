import { redirect } from "next/navigation";
import routes from "@features/routes";
import type { Metadata } from "next";
import { buildPageMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";

interface WorkspacePageProps {
  params: Promise<{ organizationId: string }>;
}

const OrganizationDashboardRedirect = ({ organizationId }: { organizationId: string }) => {
  redirect(routes.dashboard.pages.organization_dashboard.path({ organizationId }));
};

export const generateMetadata = async ({ params }: WorkspacePageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.workspace, await params);

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { organizationId } = await params;

  return (
    <OrganizationRouteGuard organizationId={organizationId}>
      <OrganizationDashboardRedirect organizationId={organizationId} />
    </OrganizationRouteGuard>
  );
}
