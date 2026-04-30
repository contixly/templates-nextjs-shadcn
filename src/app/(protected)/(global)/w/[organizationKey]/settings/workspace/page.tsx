import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import {
  WorkspaceSettingsSectionContent,
  type WorkspaceSettingsPageProps,
} from "./workspace-settings-section-content";

export const generateMetadata = async ({ params }: WorkspaceSettingsPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_workspace, await params);

export default function WorkspaceSettingsSectionPage({ params }: WorkspaceSettingsPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_workspace" />
      <Suspense
        fallback={
          <SettingsPageSection mode="readable">
            <WorkspaceSettingsPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsSectionContent params={params} />
      </Suspense>
    </>
  );
}
