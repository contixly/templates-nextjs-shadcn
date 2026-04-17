import type { Metadata } from "next";
import { loadUserWorkspaces } from "@features/workspaces/actions/load-user-workspaces";
import { UserWorkspaces } from "@features/workspaces/components/user-workspaces";
import { buildPageMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.workspaces);

/**
 * Workspaces Management Page
 *
 * Features:
 * - Displays all user's workspaces in a grid
 * - Create a new workspace button
 * - Workspace cards with counts and actions
 * - Empty state for users with no workspaces
 */
export default async function UserWorkspacesPage() {
  const loadUserWorkspacesPromise = loadUserWorkspaces();

  return <UserWorkspaces loadUserWorkspacesPromise={loadUserWorkspacesPromise} />;
}
