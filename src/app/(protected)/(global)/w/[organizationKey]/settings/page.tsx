import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import { loadWorkspaceSettingsPageContext } from "@features/workspaces/workspaces-settings";

interface WorkspaceSettingsRootPageProps {
  params: Promise<{ organizationKey: string }>;
}

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

export async function WorkspaceSettingsRootRedirectContent({
  params,
}: WorkspaceSettingsRootPageProps) {
  const { organizationKey } = await params;
  const { canonicalOrganizationKey } = await loadWorkspaceSettingsPageContext(organizationKey);

  redirect(
    workspaceRoutes.pages.settings_workspace.path({
      organizationKey: canonicalOrganizationKey,
    })
  );

  return null;
}
