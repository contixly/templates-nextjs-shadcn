import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsUsersPage } from "@features/workspaces/components/pages/workspace-settings-users-page";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { loadWorkspaceSettingsUsersPageContext } from "@features/workspaces/workspaces-settings";

export interface WorkspaceSettingsUsersPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsUsersContent({ params }: WorkspaceSettingsUsersPageProps) {
  const { organizationKey } = await params;
  const {
    workspace,
    canonicalOrganizationKey,
    currentUserId,
    members,
    canAddMembers,
    canUpdateMemberRoles,
    assignableWorkspaceRoles,
  } = await loadWorkspaceSettingsUsersPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_users.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return (
    <SettingsPageSection mode="wide">
      <WorkspaceSettingsUsersPage
        organizationId={workspace.id}
        currentUserId={currentUserId}
        members={members}
        canAddMembers={canAddMembers}
        canUpdateMemberRoles={canUpdateMemberRoles}
        assignableWorkspaceRoles={assignableWorkspaceRoles}
        showIntro={false}
      />
    </SettingsPageSection>
  );
}
