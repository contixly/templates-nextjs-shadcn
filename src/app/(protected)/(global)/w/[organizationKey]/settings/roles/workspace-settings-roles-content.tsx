import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsPlaceholderPage } from "@features/workspaces/components/pages/workspace-settings-placeholder-page";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

export interface WorkspaceSettingsRolesPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsRolesContent({ params }: WorkspaceSettingsRolesPageProps) {
  const { organizationKey } = await params;
  const { canonicalOrganizationKey } = await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_roles.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="readable">
      <WorkspaceSettingsPlaceholderPage section="roles" showIntro={false} />
    </SettingsPageSection>
  );
}
