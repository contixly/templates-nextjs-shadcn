"use server";

import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  type DeleteWorkspaceTeamInput,
  deleteWorkspaceTeamSchema,
} from "@features/workspaces/workspaces-teams-schemas";
import { findWorkspaceTeamOwnership } from "@features/workspaces/workspaces-teams-repository";
import { updateWorkspaceTeamCache } from "@features/workspaces/workspaces-teams-types";
import { resolveWorkspaceTeamMutationError } from "@features/workspaces/workspaces-teams-action-utils";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const deleteWorkspaceTeam = createProtectedActionWithInput<
  DeleteWorkspaceTeamInput,
  { organizationId: string; teamId: string }
>(
  deleteWorkspaceTeamSchema,
  async ({ organizationId, teamId }, { userId, headers }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const [canDeleteTeams, team] = await Promise.all([
      hasWorkspacePermission(organizationId, {
        team: ["delete"],
      }),
      findWorkspaceTeamOwnership(teamId, organizationId),
    ]);

    if (!team) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamNotFound,
          code: HttpCodes.NOT_FOUND,
        },
      };
    }

    if (!canDeleteTeams) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    try {
      await auth.api.setActiveTeam({
        body: {
          teamId: null,
        },
        headers,
      });

      await auth.api.removeTeam({
        body: {
          organizationId,
          teamId,
        },
        headers,
      });
    } catch (error) {
      const resolvedError = resolveWorkspaceTeamMutationError(error);

      if (resolvedError) {
        return {
          success: false,
          error: resolvedError,
        };
      }

      throw error;
    }

    updateWorkspaceTeamCache({
      organizationId,
      teamId,
      userIds: [userId],
    });

    return {
      success: true,
      data: {
        organizationId,
        teamId,
      },
    };
  },
  {
    actionName: "deleteWorkspaceTeam",
    logger: workspacesLogger,
  }
);
