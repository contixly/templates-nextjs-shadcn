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

export const OrganizationRouteGuard = async ({
  organizationKey,
  children,
}: OrganizationRouteGuardProps) => {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const accessibleOrganizations = await findManyAccessibleOrganizationsByUserId(userId);

  if (accessibleOrganizations.length === 0) {
    return <WorkspaceOnboardingGuard />;
  }

  const accessibleOrganization = findOrganizationByRouteKey(
    accessibleOrganizations,
    organizationKey
  );

  if (!accessibleOrganization) {
    forbidden();
  }

  return typeof children === "function" ? children(accessibleOrganization) : children;
};
