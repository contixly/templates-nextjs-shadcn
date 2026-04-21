import { redirect } from "next/navigation";
import type { Metadata } from "next";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPlaceholderPage } from "@features/workspaces/components/pages/workspace-settings-placeholder-page";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsUsersPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsUsersPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_users, await params);

export default async function WorkspaceSettingsUsersPage({
  params,
}: WorkspaceSettingsUsersPageProps) {
  const { organizationKey } = await params;
  const { canonicalOrganizationKey } = await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_users.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return <WorkspaceSettingsPlaceholderPage section="users" />;
}
