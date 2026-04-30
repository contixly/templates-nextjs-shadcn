import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPage } from "@features/workspaces/components/pages/workspace-settings-page";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({ params }: WorkspaceSettingsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_workspace, await params);

export default function WorkspaceSettingsSectionPage({ params }: WorkspaceSettingsPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_workspace" />
      <Suspense
        fallback={
          <SettingsPageSection mode="readable">
            <WorkspaceSettingsPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsSectionContent params={params} />
      </Suspense>
    </>
  );
}

export async function WorkspaceSettingsSectionContent({ params }: WorkspaceSettingsPageProps) {
  const { organizationKey } = await params;
  const { workspace, canUpdateWorkspace, canDeleteWorkspace, canonicalOrganizationKey } =
    await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_workspace.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="readable">
      <WorkspaceSettingsPage
        workspace={workspace}
        canUpdateWorkspace={canUpdateWorkspace}
        canDeleteWorkspace={canDeleteWorkspace}
        showIntro={false}
      />
    </SettingsPageSection>
  );
}
