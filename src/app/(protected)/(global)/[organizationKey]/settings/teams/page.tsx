import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPlaceholderPage } from "@features/workspaces/components/pages/workspace-settings-placeholder-page";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsTeamsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsTeamsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_teams, await params);

export default async function WorkspaceSettingsTeamsPage({
  params,
}: WorkspaceSettingsTeamsPageProps) {
  const { organizationKey } = await params;
  const { canonicalOrganizationKey } = await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_teams.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="readable">
      <WorkspaceSettingsPlaceholderPage section="teams" />
    </SettingsPageSection>
  );
}
