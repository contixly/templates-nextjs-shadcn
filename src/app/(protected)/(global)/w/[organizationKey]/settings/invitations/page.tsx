import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsInvitationsPage as WorkspaceSettingsInvitationsContent } from "@features/workspaces/components/pages/workspace-settings-invitations-page";
import { loadWorkspaceSettingsInvitationsPageContext } from "@features/workspaces/workspaces-invitations";
import { getWorkspaceAllowedEmailDomains } from "@features/workspaces/workspaces-domain-restrictions";

interface WorkspaceSettingsInvitationsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsInvitationsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_invitations, await params);

export default async function WorkspaceSettingsInvitationsPage({
  params,
}: WorkspaceSettingsInvitationsPageProps) {
  const { organizationKey } = await params;
  const {
    workspace,
    canonicalOrganizationKey,
    invitations,
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
      <WorkspaceSettingsInvitationsContent
        organizationId={workspace.id}
        invitations={invitations}
        canCreateInvitations={canCreateInvitations}
        assignableWorkspaceRoles={assignableWorkspaceRoles}
        allowedEmailDomains={getWorkspaceAllowedEmailDomains(workspace.metadata)}
      />
    </SettingsPageSection>
  );
}
