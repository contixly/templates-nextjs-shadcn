import type { Metadata } from "next";
import {
  SettingsPageIntro,
  SettingsPageSection,
} from "@components/application/settings/settings-shell";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";
import { getPageTranslations } from "@lib/page-translations";
import { PendingWorkspaceInvitationsBlock } from "@features/workspaces/components/pending-workspace-invitations-block";
import { loadCurrentUserPendingWorkspaceInvitations } from "@features/workspaces/workspaces-invitations";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.invitations);

export default async function UserInvitationsPage() {
  const [invitations, pageTranslations] = await Promise.all([
    loadCurrentUserPendingWorkspaceInvitations(),
    getPageTranslations(accountsRoutes.pages.invitations),
  ]);

  return (
    <SettingsPageSection mode="wide">
      <SettingsPageIntro
        title={pageTranslations.title}
        description={pageTranslations.description}
      />
      <PendingWorkspaceInvitationsBlock invitations={invitations} showEmptyState />
    </SettingsPageSection>
  );
}
