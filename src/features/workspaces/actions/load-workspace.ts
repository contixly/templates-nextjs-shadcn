"use server";

import { id } from "@lib/z";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { forbidden } from "next/navigation";

/**
 * Fetches a single workspace by ID when it belongs to the current user.
 */
export const loadWorkspace = createProtectedActionWithInput<string, WorkspaceWithCounts>(
  id,
  async (workspaceId, { userId }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(workspaceId, userId);

    if (!workspace) {
      forbidden();
    }

    return {
      success: true,
      data: workspace as WorkspaceWithCounts,
    };
  },
  { actionName: "loadWorkspace", logger: workspacesLogger }
);
