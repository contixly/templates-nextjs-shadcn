import { redirect } from "next/navigation";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

export interface WorkspaceSettingsRootPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsRootRedirectContent({
  params,
}: WorkspaceSettingsRootPageProps) {
  const { organizationKey } = await params;
  const { canonicalOrganizationKey } = await loadWorkspaceSettingsPageContext(organizationKey);

  return redirect(
    workspaceRoutes.pages.settings_workspace.path({
      organizationKey: canonicalOrganizationKey,
    })
  );
}
