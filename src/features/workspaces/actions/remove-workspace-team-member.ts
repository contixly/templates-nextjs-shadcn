"use server";

import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  type RemoveWorkspaceTeamMemberInput,
  removeWorkspaceTeamMemberSchema,
} from "@features/workspaces/workspaces-teams-schemas";
import {
  findWorkspaceTeamMembership,
  findWorkspaceTeamOwnership,
} from "@features/workspaces/workspaces-teams-repository";
import { updateWorkspaceTeamCache } from "@features/workspaces/workspaces-teams-types";
import { resolveWorkspaceTeamMutationError } from "@features/workspaces/workspaces-teams-action-utils";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const removeWorkspaceTeamMember = createProtectedActionWithInput<
  RemoveWorkspaceTeamMemberInput,
  { organizationId: string; teamId: string; userId: string }
>(
  removeWorkspaceTeamMemberSchema,
  async ({ organizationId, teamId, userId: targetUserId }, { userId, headers }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const [canRemoveTeamMembers, team, existingTeamMembership] = await Promise.all([
      hasWorkspacePermission(organizationId, {
        member: ["delete"],
      }),
      findWorkspaceTeamOwnership(teamId, organizationId),
      findWorkspaceTeamMembership(teamId, targetUserId),
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

    if (!canRemoveTeamMembers) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamMemberPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    if (!existingTeamMembership) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamMemberNotFound,
          code: HttpCodes.NOT_FOUND,
        },
      };
    }

    try {
      await auth.api.removeTeamMember({
        body: {
          organizationId,
          teamId,
          userId: targetUserId,
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
      userIds: [userId, targetUserId],
    });

    return {
      success: true,
      data: {
        organizationId,
        teamId,
        userId: targetUserId,
      },
    };
  },
  {
    actionName: "removeWorkspaceTeamMember",
    logger: workspacesLogger,
  }
);
