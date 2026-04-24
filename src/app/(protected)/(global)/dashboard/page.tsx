import type { Metadata } from "next";
import { redirect, unauthorized } from "next/navigation";
import { buildPageMetadata } from "@lib/metadata";
import dashboardRoutes from "@features/dashboard/dashboard-routes";
import { loadCurrentSession, loadCurrentUserId } from "@features/accounts/accounts-actions";
import { findManyAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";
import {
  getActiveOrganizationId,
  getOrganizationRouteKey,
  resolveDashboardOrganizationId,
} from "@features/organizations/organizations-context";
import routes from "@features/routes";
import accountsRoutes from "@features/accounts/accounts-routes";
import type { OrganizationSessionContext } from "@features/organizations/organizations-types";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(dashboardRoutes.pages.application_dashboard);

export default async function GlobalDashboardPage() {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const [session, accessibleOrganizations] = await Promise.all([
    loadCurrentSession(),
    findManyAccessibleOrganizationsByUserId(userId),
  ]);

  const organizationId = resolveDashboardOrganizationId({
    accessibleOrganizationIds: accessibleOrganizations.map((organization) => organization.id),
    activeOrganizationId: getActiveOrganizationId(session as OrganizationSessionContext),
    fallbackOrganizationId: accessibleOrganizations[0]?.id,
  });

  if (!organizationId) {
    redirect(accountsRoutes.pages.welcome.path());
  }

  const organization = accessibleOrganizations.find(
    (accessibleOrganization) => accessibleOrganization.id === organizationId
  );

  if (!organization) {
    redirect(accountsRoutes.pages.welcome.path());
  }

  redirect(
    routes.dashboard.pages.organization_dashboard.path({
      organizationKey: getOrganizationRouteKey(organization),
    })
  );
}
