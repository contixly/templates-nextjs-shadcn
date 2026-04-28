"use server";

import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import prisma from "@server/prisma";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  type AddWorkspaceTeamMemberInput,
  addWorkspaceTeamMemberSchema,
} from "@features/workspaces/workspaces-teams-schemas";
import {
  findWorkspaceTeamMembership,
  findWorkspaceTeamOwnership,
} from "@features/workspaces/workspaces-teams-repository";
import { updateWorkspaceTeamCache } from "@features/workspaces/workspaces-teams-types";
import {
  isUniqueConstraintError,
  resolveWorkspaceTeamMutationError,
} from "@features/workspaces/workspaces-teams-action-utils";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const addWorkspaceTeamMember = createProtectedActionWithInput<
  AddWorkspaceTeamMemberInput,
  { organizationId: string; teamId: string; userId: string }
>(
  addWorkspaceTeamMemberSchema,
  async ({ organizationId, teamId, userId: targetUserId }, { userId, headers }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const [canAddTeamMembers, team, targetWorkspaceMember, existingTeamMembership] =
      await Promise.all([
        hasWorkspacePermission(organizationId, {
          member: ["update"],
        }),
        findWorkspaceTeamOwnership(teamId, organizationId),
        prisma.member.findFirst({
          where: {
            organizationId,
            userId: targetUserId,
          },
          select: {
            id: true,
            userId: true,
          },
        }),
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

    if (!canAddTeamMembers) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamMemberPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    if (!targetWorkspaceMember) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamMemberCrossWorkspace,
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    if (existingTeamMembership) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.teamMemberAlreadyExists,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    try {
      await auth.api.addTeamMember({
        body: {
          organizationId,
          teamId,
          userId: targetUserId,
        },
        headers,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.teamMemberAlreadyExists,
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
    actionName: "addWorkspaceTeamMember",
    logger: workspacesLogger,
  }
);
