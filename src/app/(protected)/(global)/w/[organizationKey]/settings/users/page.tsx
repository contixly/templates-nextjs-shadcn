import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsUsersPage } from "@features/workspaces/components/pages/workspace-settings-users-page";
import { loadWorkspaceSettingsUsersPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsUsersPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsUsersPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_users, await params);

export default async function WorkspaceSettingsUsersRoutePage({
  params,
}: WorkspaceSettingsUsersPageProps) {
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
      />
    </SettingsPageSection>
  );
}
