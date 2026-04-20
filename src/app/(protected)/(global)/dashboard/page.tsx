import type { Metadata } from "next";
import { redirect, unauthorized } from "next/navigation";
import { buildPageMetadata } from "@lib/metadata";
import dashboardRoutes from "@features/dashboard/dashboard-routes";
import { loadCurrentSession, loadCurrentUserId } from "@features/accounts/accounts-actions";
import {
  findDefaultOrganizationByUserId,
  findFirstAccessibleOrganizationForUser,
  findManyAccessibleOrganizationsByUserId,
} from "@features/organizations/organizations-repository";
import {
  getActiveOrganizationId,
  resolveDefaultOrganizationId,
} from "@features/organizations/organizations-context";
import routes from "@features/routes";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(dashboardRoutes.pages.application_dashboard);

export default async function GlobalDashboardPage() {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const [session, accessibleOrganizations, defaultOrganization, fallbackOrganization] =
    await Promise.all([
      loadCurrentSession(),
      findManyAccessibleOrganizationsByUserId(userId),
      findDefaultOrganizationByUserId(userId),
      findFirstAccessibleOrganizationForUser(userId),
    ]);

  const organizationId = resolveDefaultOrganizationId({
    accessibleOrganizationIds: accessibleOrganizations.map((organization) => organization.id),
    activeOrganizationId: getActiveOrganizationId(session),
    defaultOrganizationId: defaultOrganization?.id,
    fallbackOrganizationId: fallbackOrganization?.id,
  });

  if (!organizationId) {
    redirect(accountsRoutes.pages.welcome.path());
  }

  redirect(routes.dashboard.pages.organization_dashboard.path({ organizationId }));
}
