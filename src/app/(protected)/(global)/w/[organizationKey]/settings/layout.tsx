import React, { Suspense } from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { loadAccessibleOrganization } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";
import { NavWorkspaceSettingsSkeleton } from "@features/workspaces/components/nav/nav-workspace-settings-skeleton";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";

export default function WorkspaceSettingsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ organizationKey: string }>;
}>) {
  return (
    <SettingsPageShell
      nav={
        <Suspense fallback={<NavWorkspaceSettingsSkeleton className="w-full shrink-0 md:w-64" />}>
          <WorkspaceSettingsNav params={params} />
        </Suspense>
      }
    >
      {children}
    </SettingsPageShell>
  );
}

export async function WorkspaceSettingsNav({
  params,
}: Readonly<{
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
    <NavWorkspaceSettings
      organizationKey={getOrganizationRouteKey(organization)}
      canCreateInvitations={canCreateInvitations}
    />
  );
}
