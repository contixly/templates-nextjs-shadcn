import { forbidden, redirect, unauthorized } from "next/navigation";
import routes from "@features/routes";
import type { Metadata } from "next";
import { buildPageMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { findFirstWorkspaceByIdAndUserId } from "@features/workspaces/workspaces-repository";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export const generateMetadata = async ({ params }: WorkspacePageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.workspace, await params);

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const userId = await loadCurrentUserId();

  if (!userId) {
    unauthorized();
  }

  const workspace = await findFirstWorkspaceByIdAndUserId(workspaceId, userId, {
    id: true,
  });

  if (!workspace) {
    forbidden();
  }

  redirect(routes.dashboard.pages.application_dashboard.path());
}
