import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsPage } from "@features/workspaces/components/pages/workspace-settings-page";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

export interface WorkspaceSettingsPageProps {
  params: Promise<{ organizationKey: string }>;
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
