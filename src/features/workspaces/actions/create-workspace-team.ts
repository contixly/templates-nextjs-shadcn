"use server";

import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  type CreateWorkspaceTeamInput,
  createWorkspaceTeamSchema,
} from "@features/workspaces/workspaces-teams-schemas";
import {
  findWorkspaceTeamByIdAndOrganizationIdAndUserId,
  findWorkspaceTeamByOrganizationIdAndNormalizedName,
} from "@features/workspaces/workspaces-teams-repository";
import {
  updateWorkspaceTeamCache,
  type WorkspaceTeamListItemDto,
} from "@features/workspaces/workspaces-teams-types";
import {
  isUniqueConstraintError,
  resolveWorkspaceTeamMutationError,
} from "@features/workspaces/workspaces-teams-action-utils";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

interface BetterAuthTeamResponse {
  id: string;
}

export const createWorkspaceTeam = createProtectedActionWithInput<
  CreateWorkspaceTeamInput,
  WorkspaceTeamListItemDto
>(
  createWorkspaceTeamSchema,
  async ({ organizationId, name }, { userId, headers }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const canCreateTeams = await hasWorkspacePermission(organizationId, {
      team: ["create"],
    });

    if (!canCreateTeams) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    const existingTeam = await findWorkspaceTeamByOrganizationIdAndNormalizedName({
      organizationId,
      name,
    });

    if (existingTeam) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamDuplicateName,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    let createdTeam: BetterAuthTeamResponse;

    try {
      createdTeam = (await auth.api.createTeam({
        body: {
          organizationId,
          name,
        },
        headers,
      })) as BetterAuthTeamResponse;
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
      teamId: createdTeam.id,
      userIds: [userId],
    });

    const team = await findWorkspaceTeamByIdAndOrganizationIdAndUserId(
      createdTeam.id,
      organizationId,
      userId
    );

    if (!team) {
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
      data: team,
    };
  },
  {
    actionName: "createWorkspaceTeam",
    logger: workspacesLogger,
  }
);
