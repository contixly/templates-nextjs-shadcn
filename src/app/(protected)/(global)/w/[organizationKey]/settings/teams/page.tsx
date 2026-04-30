import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsTeamsPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import {
  WorkspaceSettingsTeamsContent,
  type WorkspaceSettingsTeamsPageProps,
} from "./workspace-settings-teams-content";

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsTeamsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_teams, await params);

export default function WorkspaceSettingsTeamsPage({ params }: WorkspaceSettingsTeamsPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_teams" />
      <Suspense
        fallback={
          <SettingsPageSection mode="wide">
            <WorkspaceSettingsTeamsPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsTeamsContent params={params} />
      </Suspense>
    </>
  );
}
