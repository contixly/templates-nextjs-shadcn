import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsTeamsPage as WorkspaceSettingsTeamsContent } from "@features/workspaces/components/pages/workspace-settings-teams-page";
import { loadWorkspaceSettingsTeamsPageContext } from "@features/workspaces/workspaces-settings";

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
  const {
    workspace,
    canonicalOrganizationKey,
    teams,
    teamMembersByTeamId,
    assignableMembers,
    canCreateTeams,
    canUpdateTeams,
    canDeleteTeams,
    canAddTeamMembers,
    canRemoveTeamMembers,
  } = await loadWorkspaceSettingsTeamsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_teams.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="wide">
      <WorkspaceSettingsTeamsContent
        organizationId={workspace.id}
        teams={teams}
        teamMembersByTeamId={teamMembersByTeamId}
        assignableMembers={assignableMembers}
        canCreateTeams={canCreateTeams}
        canUpdateTeams={canUpdateTeams}
        canDeleteTeams={canDeleteTeams}
        canAddTeamMembers={canAddTeamMembers}
        canRemoveTeamMembers={canRemoveTeamMembers}
      />
    </SettingsPageSection>
  );
}
