import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  SettingsContentRail,
  SettingsPageSection,
} from "@components/application/settings/settings-shell";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceInvitationDecisionPage } from "@features/workspaces/components/pages/workspace-invitation-decision-page";
import { loadWorkspaceInvitationDecisionPageContext } from "@features/workspaces/workspaces-invitations";

interface WorkspaceInvitationDecisionRoutePageProps {
  params: Promise<{ invitationId: string }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceInvitationDecisionRoutePageProps): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.invitation, await params);

export default async function WorkspaceInvitationDecisionRoutePage({
  params,
}: WorkspaceInvitationDecisionRoutePageProps) {
  const { invitationId } = await params;
  const context = await loadWorkspaceInvitationDecisionPageContext(invitationId);

  if (!context) {
    notFound();
  }

  return (
    <SettingsContentRail>
      <SettingsPageSection mode="readable">
        <WorkspaceInvitationDecisionPage context={context} />
      </SettingsPageSection>
    </SettingsContentRail>
  );
}
