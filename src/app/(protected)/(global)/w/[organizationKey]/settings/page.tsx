import type { Metadata } from "next";
import { Suspense } from "react";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import {
  WorkspaceSettingsRootRedirectContent,
  type WorkspaceSettingsRootPageProps,
} from "./workspace-settings-root-redirect-content";

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsRootPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings, await params);

export default function WorkspaceSettingsRootPage({ params }: WorkspaceSettingsRootPageProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceSettingsRootRedirectContent params={params} />
    </Suspense>
  );
}
