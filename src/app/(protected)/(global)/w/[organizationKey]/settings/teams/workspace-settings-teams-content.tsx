import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsTeamsPage as WorkspaceSettingsTeamsPageComponent } from "@features/workspaces/components/pages/workspace-settings-teams-page";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { loadWorkspaceSettingsTeamsPageContext } from "@features/workspaces/workspaces-settings";

export interface WorkspaceSettingsTeamsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsTeamsContent({ params }: WorkspaceSettingsTeamsPageProps) {
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
      <WorkspaceSettingsTeamsPageComponent
        organizationId={workspace.id}
        teams={teams}
        teamMembersByTeamId={teamMembersByTeamId}
        assignableMembers={assignableMembers}
        canCreateTeams={canCreateTeams}
        canUpdateTeams={canUpdateTeams}
        canDeleteTeams={canDeleteTeams}
        canAddTeamMembers={canAddTeamMembers}
        canRemoveTeamMembers={canRemoveTeamMembers}
        showIntro={false}
      />
    </SettingsPageSection>
  );
}
