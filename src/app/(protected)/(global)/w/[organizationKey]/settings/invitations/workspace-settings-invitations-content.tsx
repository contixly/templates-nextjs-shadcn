import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsInvitationsPage as WorkspaceSettingsInvitationsPageComponent } from "@features/workspaces/components/pages/workspace-settings-invitations-page";
import { getWorkspaceAllowedEmailDomains } from "@features/workspaces/workspaces-domain-restrictions";
import { loadWorkspaceSettingsInvitationsPageContext } from "@features/workspaces/workspaces-invitations";
import workspaceRoutes from "@features/workspaces/workspaces-routes";

export interface WorkspaceSettingsInvitationsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsInvitationsContent({
  params,
}: WorkspaceSettingsInvitationsPageProps) {
  const { organizationKey } = await params;
  const {
    workspace,
    canonicalOrganizationKey,
    invitations,
    teams,
    canCreateInvitations,
    assignableWorkspaceRoles,
  } = await loadWorkspaceSettingsInvitationsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_invitations.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="wide">
      <WorkspaceSettingsInvitationsPageComponent
        organizationId={workspace.id}
        invitations={invitations}
        teams={teams}
        canCreateInvitations={canCreateInvitations}
        assignableWorkspaceRoles={assignableWorkspaceRoles}
        allowedEmailDomains={getWorkspaceAllowedEmailDomains(workspace.metadata)}
        showIntro={false}
      />
    </SettingsPageSection>
  );
}
