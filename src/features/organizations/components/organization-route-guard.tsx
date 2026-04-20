import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";
import { findManyAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";

interface OrganizationRouteGuardProps {
  organizationId: string;
  children: React.ReactNode;
}

export const OrganizationRouteGuard = async ({
  organizationId,
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

  const isAccessible = accessibleOrganizations.some(
    (organization) => organization.id === organizationId
  );

  if (!isAccessible) {
    forbidden();
  }

  return children;
};
