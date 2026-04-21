import React from "react";
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
        <div className="flex flex-1 md:gap-8">
          <NavWorkspaceSettings organizationKey={getOrganizationRouteKey(organization)} />
          <main className="max-w-2xl min-w-0 flex-1 space-y-6 px-2 md:mt-4 md:px-0">
            {children}
          </main>
        </div>
      )}
    </OrganizationRouteGuard>
  );
}
