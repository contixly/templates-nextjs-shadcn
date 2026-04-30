import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import {
  WorkspacePageRedirectContent,
  type WorkspacePageProps,
} from "./workspace-page-redirect-content";

export const generateMetadata = async ({ params }: WorkspacePageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.workspace, await params);

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={null}>
      <WorkspacePageRedirectContent params={params} />
    </Suspense>
  );
}
