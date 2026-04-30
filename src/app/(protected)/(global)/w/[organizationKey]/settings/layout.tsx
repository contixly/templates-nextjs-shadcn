import React, { Suspense, use } from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { loadAccessibleOrganization } from "@features/organizations/components/organization-route-guard";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import { NavWorkspaceSettingsSkeleton } from "@features/workspaces/components/nav/nav-workspace-settings-skeleton";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";
import { WorkspaceSettingsNav } from "./workspace-settings-nav";

type WorkspaceSettingsParams = Promise<{ organizationKey: string }>;
type AccessibleOrganization = Awaited<ReturnType<typeof loadAccessibleOrganization>>;

export default function WorkspaceSettingsLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: WorkspaceSettingsParams;
}>) {
  const organizationPromise = loadAccessibleOrganizationFromParams(params);

  return (
    <Suspense fallback={<WorkspaceSettingsLayoutFallback />}>
      <WorkspaceSettingsLayoutContent organizationPromise={organizationPromise}>
        {children}
      </WorkspaceSettingsLayoutContent>
    </Suspense>
  );
}

const loadAccessibleOrganizationFromParams = async (params: WorkspaceSettingsParams) => {
  const { organizationKey } = await params;

  return loadAccessibleOrganization(organizationKey);
};

function WorkspaceSettingsLayoutFallback() {
  return <SettingsPageShell nav={<WorkspaceSettingsNavFallback />} />;
}

function WorkspaceSettingsNavFallback() {
  return <NavWorkspaceSettingsSkeleton className="w-full shrink-0 md:w-64" />;
}

function WorkspaceSettingsLayoutContent({
  children,
  organizationPromise,
}: Readonly<{
  children: React.ReactNode;
  organizationPromise: Promise<AccessibleOrganization>;
}>) {
  const organization = use(organizationPromise);

  if (!organization) {
    return <WorkspaceOnboardingGuard />;
  }
  const canonicalOrganizationKey = getOrganizationRouteKey(organization);

  return (
    <SettingsPageShell
      nav={
        <Suspense fallback={<WorkspaceSettingsNavFallback />}>
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
