import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsInvitationsPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import {
  WorkspaceSettingsInvitationsContent,
  type WorkspaceSettingsInvitationsPageProps,
} from "./workspace-settings-invitations-content";

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
