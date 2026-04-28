"use server";

import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  type SetActiveWorkspaceTeamInput,
  setActiveWorkspaceTeamSchema,
} from "@features/workspaces/workspaces-teams-schemas";
import {
  findWorkspaceTeamMembership,
  findWorkspaceTeamOwnership,
} from "@features/workspaces/workspaces-teams-repository";
import { updateWorkspaceTeamCache } from "@features/workspaces/workspaces-teams-types";
import { resolveWorkspaceTeamMutationError } from "@features/workspaces/workspaces-teams-action-utils";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const setActiveWorkspaceTeam = createProtectedActionWithInput<
  SetActiveWorkspaceTeamInput,
  { organizationId: string; teamId: string | null }
>(
  setActiveWorkspaceTeamSchema,
  async ({ organizationId, teamId = null }, { userId, headers }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    if (teamId) {
      const [team, teamMembership] = await Promise.all([
        findWorkspaceTeamOwnership(teamId, organizationId),
        findWorkspaceTeamMembership(teamId, userId),
      ]);

      if (!team) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.activeTeamInvalid,
            code: HttpCodes.BAD_REQUEST,
          },
        };
      }

      if (!teamMembership) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.activeTeamPermissionDenied,
            code: HttpCodes.FORBIDDEN,
          },
        };
      }
    }

    try {
      if (teamId) {
        await auth.api.setActiveOrganization({
          body: {
            organizationId,
          },
          headers,
        });
      }

      await auth.api.setActiveTeam({
        body: {
          teamId,
        },
        headers,
        ...(teamId
          ? {
              query: {
                disableCookieCache: true,
              },
            }
          : {}),
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
    actionName: "setActiveWorkspaceTeam",
    logger: workspacesLogger,
  }
);
