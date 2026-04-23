import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";
import { PendingWorkspaceInvitationsBlock } from "@features/workspaces/components/pending-workspace-invitations-block";
import { loadCurrentUserPendingWorkspaceInvitations } from "@features/workspaces/workspaces-invitations";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.invitations);

export default async function UserInvitationsPage() {
  const invitations = await loadCurrentUserPendingWorkspaceInvitations();

  return (
    <SettingsPageSection mode="wide">
      <PendingWorkspaceInvitationsBlock invitations={invitations} showEmptyState />
    </SettingsPageSection>
  );
}
