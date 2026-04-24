import React from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { loadAccessibleOrganization } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ organizationKey: string }>;
}>) {
  const { organizationKey } = await params;
  const organization = await loadAccessibleOrganization(organizationKey);

  if (!organization) {
    return <WorkspaceOnboardingGuard />;
  }

  const canCreateInvitations = await hasWorkspacePermission(organization.id, {
    invitation: ["create"],
  });

  return (
    <SettingsPageShell
      nav={
        <NavWorkspaceSettings
          organizationKey={getOrganizationRouteKey(organization)}
          canCreateInvitations={canCreateInvitations}
        />
      }
    >
      {children}
    </SettingsPageShell>
  );
}
