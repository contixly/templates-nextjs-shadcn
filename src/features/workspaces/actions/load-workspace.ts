"use server";

import { id } from "@lib/z";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { findFirstWorkspaceByIdAndUserIdWithCounts } from "@features/workspaces/workspaces-repository";
import { forbidden } from "next/navigation";

/**
 * Fetches a single Workspace by ID with placeholder entity counts.
 */
export const loadWorkspace = createProtectedActionWithInput<string, WorkspaceWithCounts>(
  id,
  async (workspaceId, { userId }) => {
    const workspace = await findFirstWorkspaceByIdAndUserIdWithCounts(workspaceId, userId, {
      name: true,
      isDefault: true,
    });

    if (!workspace) {
      forbidden();
    }

    return {
      success: true,
      data: workspace,
    };
  },
  { actionName: "loadWorkspace", logger: workspacesLogger }
);
