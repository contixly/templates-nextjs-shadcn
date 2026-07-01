import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { ApiKeyManagementPage } from "@features/api-keys/components/api-key-management-page";
import { loadOrganizationApiKeysPageData } from "@features/api-keys/api-keys-management";
import { loadWorkspaceSettingsApiKeysPageContext } from "@features/workspaces/workspaces-settings";
import workspaceRoutes from "@features/workspaces/workspaces-routes";

export interface WorkspaceSettingsApiKeysPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsApiKeysContent({
  params,
}: WorkspaceSettingsApiKeysPageProps) {
  const { organizationKey } = await params;
  const { workspace, canonicalOrganizationKey } =
    await loadWorkspaceSettingsApiKeysPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_api_keys.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  const pageData = await loadOrganizationApiKeysPageData({
    organizationId: workspace.id,
    organizationKey: canonicalOrganizationKey,
  });

  return (
    <SettingsPageSection mode="wide">
      <ApiKeyManagementPage pageData={pageData} showIntro={false} />
    </SettingsPageSection>
  );
}
