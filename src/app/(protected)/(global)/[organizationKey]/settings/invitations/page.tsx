import { redirect } from "next/navigation";
import type { Metadata } from "next";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsPlaceholderPage } from "@features/workspaces/components/pages/workspace-settings-placeholder-page";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

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
  const { canonicalOrganizationKey } = await loadWorkspaceSettingsPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_invitations.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  return <WorkspaceSettingsPlaceholderPage section="invitations" />;
}
