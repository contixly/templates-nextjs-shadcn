import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsInvitationsPage as WorkspaceSettingsInvitationsPageComponent } from "@features/workspaces/components/pages/workspace-settings-invitations-page";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsInvitationsPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import { loadWorkspaceSettingsInvitationsPageContext } from "@features/workspaces/workspaces-invitations";
import { getWorkspaceAllowedEmailDomains } from "@features/workspaces/workspaces-domain-restrictions";

interface WorkspaceSettingsInvitationsPageProps {
  params: Promise<{ organizationKey: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsInvitationsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_invitations, await params);

export default function WorkspaceSettingsInvitationsPage({
  params,
}: WorkspaceSettingsInvitationsPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_invitations" />
      <Suspense
        fallback={
          <SettingsPageSection mode="wide">
            <WorkspaceSettingsInvitationsPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsInvitationsContent params={params} />
      </Suspense>
    </>
  );
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
