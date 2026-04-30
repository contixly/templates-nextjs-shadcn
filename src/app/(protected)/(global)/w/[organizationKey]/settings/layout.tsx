import React, { Suspense } from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { loadAccessibleOrganization } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";
import { NavWorkspaceSettingsSkeleton } from "@features/workspaces/components/nav/nav-workspace-settings-skeleton";
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
  const canonicalOrganizationKey = getOrganizationRouteKey(organization);

  return (
    <SettingsPageShell
      nav={
        <Suspense fallback={<NavWorkspaceSettingsSkeleton className="w-full shrink-0 md:w-64" />}>
          <WorkspaceSettingsNav
            organizationId={organization.id}
            organizationKey={canonicalOrganizationKey}
          />
        </Suspense>
      }
    >
      {children}
    </SettingsPageShell>
  );
}

export async function WorkspaceSettingsNav({
  organizationId,
  organizationKey,
}: Readonly<{
  organizationId: string;
  organizationKey: string;
}>) {
  const canCreateInvitations = await hasWorkspacePermission(organizationId, {
    invitation: ["create"],
  });

  return (
    <NavWorkspaceSettings
      organizationKey={organizationKey}
      canCreateInvitations={canCreateInvitations}
    />
  );
}
