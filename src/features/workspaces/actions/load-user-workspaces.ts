"use server";

import { findManyWorkspacesByUserId } from "@features/workspaces/workspaces-repository";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { createProtectedAction } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

/**
 * Loads all workspaces associated with an authenticated user and returns them with placeholder counts
 * for tasks and goals. The placeholder counts are intended for future updates when respective features
 * are implemented.
 *
 * This is a protected action that requires the user to be authenticated. It fetches all workspaces
 * for the given user and enriches each workspace with a `_count` object to provide placeholder data
 * for sidebar badge enrichment.
 *
 * Placeholder counts:
 * - `tasks`: Always set to 0. This will represent the real task count when the related feature is implemented.
 * - `goals`: Always set to 0. This will represent the real goal count when the related feature is implemented.
 *
 * Action name: `"loadUserWorkspaces"`
 *
 * @constant {Function} loadUserWorkspaces
 * @param {Object} context - The context object containing required parameters.
 * @param {string} context.userId - The unique identifier of the authenticated user.
 * @param {Object} context.logger - The logger instance used for logging details of the action.
 * @returns {Promise<Object>} An object indicating the success of the action, containing the enriched workspace data.
 * @throws {Error} Throws an error if any issue occurs while fetching workspaces.
 */
export const loadUserWorkspaces = createProtectedAction<WorkspaceWithCounts[]>(
  async ({ userId, logger }) => {
    logger.debug("Fetching all workspaces for authenticated user with placeholder counts");
    const workspaces = await findManyWorkspacesByUserId(userId);

    // 4. Return success with data
    return {
      success: true,
      data: workspaces,
    };
  },
  { actionName: "loadUserWorkspaces", logger: workspacesLogger }
);
