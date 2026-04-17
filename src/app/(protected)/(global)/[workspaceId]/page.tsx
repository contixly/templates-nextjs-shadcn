import { redirect } from "next/navigation";
import routes from "@features/routes";
import { loadWorkspace } from "@features/workspaces/actions/load-workspace";
import { Suspense } from "react";
import { Spinner } from "@components/ui/spinner";
import type { Metadata } from "next";
import { buildPageMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export const generateMetadata = async ({ params }: WorkspacePageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.workspace, await params);

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense
      fallback={
        // TODO fallbalk to dashboard page
        <div className="fixed inset-0 z-10 flex h-full w-full items-center justify-center">
          <Spinner className="size-10" />
        </div>
      }
    >
      <WorkspacePageRedirector params={params} />
    </Suspense>
  );
}

async function WorkspacePageRedirector({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const { data: workspace } = await loadWorkspace(workspaceId);

  if (!workspace) return null;
  redirect(routes.dashboard.pages.application_dashboard.path());
}
