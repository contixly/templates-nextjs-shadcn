"use server";

import { headers } from "next/headers";
import { forbidden } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { updateTags } from "@lib/cache";
import { auth } from "@server/auth";
import prisma from "@server/prisma";
import {
  findOrganizationMemberByOrganizationIdAndUserId,
  findWorkspaceDtoByIdAndUserId,
} from "@features/organizations/organizations-repository";
import { CACHE_OrganizationMembersTag } from "@features/organizations/organizations-types";
import {
  updateWorkspaceMemberRoleSchema,
  type UpdateWorkspaceMemberRoleInput,
} from "@features/workspaces/workspaces-invitations-schemas";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  canAssignWorkspaceRole,
  canUpdateWorkspaceMemberRole,
  getSingleWorkspaceManageableRole,
} from "@features/workspaces/workspaces-roles";
import { updateWorkspaceCache } from "@features/workspaces/workspaces-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const updateWorkspaceMemberRole = createProtectedActionWithInput<
  UpdateWorkspaceMemberRoleInput,
  { organizationId: string; memberId: string; role: string }
>(
  updateWorkspaceMemberRoleSchema,
  async ({ organizationId, memberId, role }, { userId }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const canUpdateMemberRoles = await hasWorkspacePermission(organizationId, {
      member: ["update"],
    });

    if (!canUpdateMemberRoles) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberRoleUpdatePermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    const [actingMember, targetMember] = await Promise.all([
      findOrganizationMemberByOrganizationIdAndUserId(organizationId, userId, {
        role: true,
      }),
      prisma.member.findFirst({
        where: {
          id: memberId,
          organizationId,
        },
        select: {
          id: true,
          organizationId: true,
          userId: true,
          role: true,
        },
      }),
    ]);

    if (!targetMember) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberNotFound,
          code: HttpCodes.NOT_FOUND,
        },
      };
    }

    if (
      !canUpdateWorkspaceMemberRole({
        actorRole: actingMember?.role,
        currentUserId: userId,
        targetRole: targetMember.role,
        targetUserId: targetMember.userId,
      })
    ) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberRoleUpdateDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    if (!canAssignWorkspaceRole(actingMember?.role, role)) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.workspaceRolePermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    if (getSingleWorkspaceManageableRole(targetMember.role) === role) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberRoleUnchanged,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    try {
      await auth.api.updateMemberRole({
        body: {
          organizationId,
          memberId,
          role,
        },
        headers: await headers(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("Member not found")) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.memberNotFound,
            code: HttpCodes.NOT_FOUND,
          },
        };
      }

      if (message.includes("not allowed") || message.includes("without an owner")) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.memberRoleUpdateDenied,
            code: HttpCodes.FORBIDDEN,
          },
        };
      }

      throw error;
    }

    updateWorkspaceCache({ workspaceId: organizationId, userId });
    updateWorkspaceCache({ workspaceId: organizationId, userId: targetMember.userId });
    updateTags([CACHE_OrganizationMembersTag(organizationId)]);

    return {
      success: true,
      data: {
        organizationId,
        memberId,
        role,
      },
    };
  },
  {
    actionName: "updateWorkspaceMemberRole",
    logger: workspacesLogger,
  }
);
