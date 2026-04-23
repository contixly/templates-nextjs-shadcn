import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";
import { findManyAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";
import { findOrganizationByRouteKey } from "@features/organizations/organizations-context";
import type { OrganizationWorkspaceDto } from "@features/organizations/organizations-types";

interface OrganizationRouteGuardProps {
  organizationKey: string;
  children: React.ReactNode | ((organization: OrganizationWorkspaceDto) => React.ReactNode);
}

export const loadAccessibleOrganization = async (organizationKey: string) => {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const accessibleOrganizations = await findManyAccessibleOrganizationsByUserId(userId);

  if (accessibleOrganizations.length === 0) {
    return null;
  }

  const accessibleOrganization = findOrganizationByRouteKey(
    accessibleOrganizations,
    organizationKey
  );

  if (!accessibleOrganization) {
    forbidden();
  }

  return accessibleOrganization;
};

export const OrganizationRouteGuard = async ({
  organizationKey,
  children,
}: OrganizationRouteGuardProps) => {
  const accessibleOrganization = await loadAccessibleOrganization(organizationKey);

  if (!accessibleOrganization) {
    return <WorkspaceOnboardingGuard />;
  }

  return typeof children === "function" ? children(accessibleOrganization) : children;
};
