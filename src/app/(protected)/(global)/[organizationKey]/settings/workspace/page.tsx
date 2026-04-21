import { redirect } from "next/navigation";
import type { Metadata } from "next";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPage } from "@features/workspaces/components/pages/workspace-settings-page";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({ params }: WorkspaceSettingsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_workspace, await params);

export default async function WorkspaceSettingsSectionPage({ params }: WorkspaceSettingsPageProps) {
  const { organizationKey } = await params;
  const { workspace, canChangeDefault, canonicalOrganizationKey } =
    await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_workspace.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return <WorkspaceSettingsPage workspace={workspace} canChangeDefault={canChangeDefault} />;
}
