import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsPlaceholderPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import {
  WorkspaceSettingsRolesContent,
  type WorkspaceSettingsRolesPageProps,
} from "./workspace-settings-roles-content";

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsRolesPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_roles, await params);

export default function WorkspaceSettingsRolesPage({ params }: WorkspaceSettingsRolesPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_roles" />
      <Suspense
        fallback={
          <SettingsPageSection mode="readable">
            <WorkspaceSettingsPlaceholderPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsRolesContent params={params} />
      </Suspense>
    </>
  );
}
