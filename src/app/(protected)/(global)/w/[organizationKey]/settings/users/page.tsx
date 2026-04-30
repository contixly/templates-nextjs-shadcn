import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsUsersPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import {
  WorkspaceSettingsUsersContent,
  type WorkspaceSettingsUsersPageProps,
} from "./workspace-settings-users-content";

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsUsersPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_users, await params);

export default function WorkspaceSettingsUsersRoutePage({
  params,
}: WorkspaceSettingsUsersPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_users" />
      <Suspense
        fallback={
          <SettingsPageSection mode="wide">
            <WorkspaceSettingsUsersPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsUsersContent params={params} />
      </Suspense>
    </>
  );
}
