import React from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ organizationKey: string }>;
}>) {
  const { organizationKey } = await params;

  return (
    <OrganizationRouteGuard organizationKey={organizationKey}>
      {(organization) => (
        <SettingsPageShell
          nav={<NavWorkspaceSettings organizationKey={getOrganizationRouteKey(organization)} />}
        >
          {children}
        </SettingsPageShell>
      )}
    </OrganizationRouteGuard>
  );
}
