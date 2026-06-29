import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsPlaceholderPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import {
  WorkspaceSettingsApiKeysContent,
  type WorkspaceSettingsApiKeysPageProps,
} from "./workspace-settings-api-keys-content";

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsApiKeysPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_api_keys, await params);

export default function WorkspaceSettingsApiKeysRoutePage({
  params,
}: WorkspaceSettingsApiKeysPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_api_keys" />
      <Suspense
        fallback={
          <SettingsPageSection mode="wide">
            <WorkspaceSettingsPlaceholderPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsApiKeysContent params={params} />
      </Suspense>
    </>
  );
}
