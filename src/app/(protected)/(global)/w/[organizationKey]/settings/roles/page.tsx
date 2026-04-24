import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPlaceholderPage } from "@features/workspaces/components/pages/workspace-settings-placeholder-page";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsRolesPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsRolesPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_roles, await params);

export default async function WorkspaceSettingsRolesPage({
  params,
}: WorkspaceSettingsRolesPageProps) {
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
      <WorkspaceSettingsPlaceholderPage section="roles" />
    </SettingsPageSection>
  );
}
