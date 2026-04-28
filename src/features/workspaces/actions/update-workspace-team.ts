"use server";

import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  type UpdateWorkspaceTeamInput,
  updateWorkspaceTeamSchema,
} from "@features/workspaces/workspaces-teams-schemas";
import {
  findWorkspaceTeamByIdAndOrganizationIdAndUserId,
  findWorkspaceTeamByOrganizationIdAndNormalizedName,
  findWorkspaceTeamOwnership,
} from "@features/workspaces/workspaces-teams-repository";
import {
  updateWorkspaceTeamCache,
  type WorkspaceTeamListItemDto,
} from "@features/workspaces/workspaces-teams-types";
import { normalizeWorkspaceTeamNameForComparison } from "@features/workspaces/workspaces-teams-utils";
import {
  isUniqueConstraintError,
  resolveWorkspaceTeamMutationError,
} from "@features/workspaces/workspaces-teams-action-utils";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const updateWorkspaceTeam = createProtectedActionWithInput<
  UpdateWorkspaceTeamInput,
  WorkspaceTeamListItemDto
>(
  updateWorkspaceTeamSchema,
  async ({ organizationId, teamId, name }, { userId, headers }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const [canUpdateTeams, team] = await Promise.all([
      hasWorkspacePermission(organizationId, {
        team: ["update"],
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

    if (!canUpdateTeams) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    if (
      normalizeWorkspaceTeamNameForComparison(team.name) ===
      normalizeWorkspaceTeamNameForComparison(name)
    ) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamNameUnchanged,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    const duplicateTeam = await findWorkspaceTeamByOrganizationIdAndNormalizedName({
      organizationId,
      name,
      excludeTeamId: teamId,
    });

    if (duplicateTeam) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamDuplicateName,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    try {
      await auth.api.updateTeam({
        body: {
          teamId,
          data: {
            organizationId,
            name,
          },
        },
        headers,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.teamDuplicateName,
            code: HttpCodes.CONFLICT,
          },
        };
      }

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

    const updatedTeam = await findWorkspaceTeamByIdAndOrganizationIdAndUserId(
      teamId,
      organizationId,
      userId
    );

    if (!updatedTeam) {
      return {
        success: false,
        error: {
          message: "500",
          code: HttpCodes.SERVER_ERROR,
        },
      };
    }

    return {
      success: true,
      data: updatedTeam,
    };
  },
  {
    actionName: "updateWorkspaceTeam",
    logger: workspacesLogger,
  }
);
