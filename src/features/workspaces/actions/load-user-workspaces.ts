"use server";

import { findManyAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { createProtectedAction } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

/** Loads all organization-backed workspaces for the authenticated user. */
export const loadUserWorkspaces = createProtectedAction<WorkspaceWithCounts[]>(
  async ({ userId, logger }) => {
    logger.debug("Fetching all workspaces for authenticated user");
    const workspaces = await findManyAccessibleOrganizationsByUserId(userId);

    // 4. Return success with data
    return {
      success: true,
      data: workspaces,
    };
  },
  { actionName: "loadUserWorkspaces", logger: workspacesLogger }
);
