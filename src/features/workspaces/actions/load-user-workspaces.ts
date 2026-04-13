"use server";

import { findManyWorkspacesByUserId } from "@features/workspaces/workspaces-repository";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { createProtectedAction } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

/** Loads all workspaces for the authenticated user (see `findManyWorkspacesByUserId`). */
export const loadUserWorkspaces = createProtectedAction<WorkspaceWithCounts[]>(
  async ({ userId, logger }) => {
    logger.debug("Fetching all workspaces for authenticated user");
    const workspaces = await findManyWorkspacesByUserId(userId);

    // 4. Return success with data
    return {
      success: true,
      data: workspaces,
    };
  },
  { actionName: "loadUserWorkspaces", logger: workspacesLogger }
);
