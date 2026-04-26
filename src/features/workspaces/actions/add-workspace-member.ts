"use server";

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
  type AddWorkspaceMemberInput,
  addWorkspaceMemberSchema,
} from "@features/workspaces/workspaces-invitations-schemas";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { canAssignWorkspaceRole } from "@features/workspaces/workspaces-roles";
import { updateWorkspaceCache } from "@features/workspaces/workspaces-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { evaluateWorkspaceEmailDomainEligibility } from "@features/workspaces/workspaces-domain-restrictions";

export interface AddWorkspaceMemberDomainRestrictionWarning {
  status: "domain-restriction-warning";
  organizationId: string;
  userId: string;
  email: string;
  emailDomain: string | null;
  allowedEmailDomains: string[];
  role: AddWorkspaceMemberInput["role"];
}

export type AddWorkspaceMemberResult =
  | {
      organizationId: string;
      userId: string;
    }
  | AddWorkspaceMemberDomainRestrictionWarning;

export const addWorkspaceMember = createProtectedActionWithInput<
  AddWorkspaceMemberInput,
  AddWorkspaceMemberResult
>(
  addWorkspaceMemberSchema,
  async (
    { organizationId, userId: targetUserId, role, acknowledgeDomainRestriction },
    { userId, headers }
  ) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const canAddMembers = await hasWorkspacePermission(organizationId, {
      member: ["create"],
    });

    if (!canAddMembers) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    const actingMember = await findOrganizationMemberByOrganizationIdAndUserId(
      organizationId,
      userId,
      {
        role: true,
      }
    );

    if (!canAssignWorkspaceRole(actingMember?.role, role)) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.workspaceRolePermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    const [targetUser, existingMember] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
          email: true,
        },
      }),
      findOrganizationMemberByOrganizationIdAndUserId(organizationId, targetUserId, {
        id: true,
      }),
    ]);

    if (!targetUser) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberNotFound,
          code: HttpCodes.NOT_FOUND,
        },
      };
    }

    if (existingMember) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.memberAlreadyExists,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    const domainEligibility = evaluateWorkspaceEmailDomainEligibility(
      workspace.metadata,
      targetUser.email
    );

    if (!domainEligibility.allowed && !acknowledgeDomainRestriction) {
      return {
        success: true,
        data: {
          status: "domain-restriction-warning",
          organizationId,
          userId: targetUser.id,
          email: targetUser.email,
          emailDomain: domainEligibility.emailDomain,
          allowedEmailDomains: domainEligibility.allowedEmailDomains,
          role,
        },
      };
    }

    try {
      await auth.api.addMember({
        body: {
          organizationId,
          userId: targetUser.id,
          role,
        },
        headers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("already a member") || message.includes("Unique constraint failed")) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.memberAlreadyExists,
            code: HttpCodes.CONFLICT,
          },
        };
      }

      throw error;
    }

    updateWorkspaceCache({ workspaceId: organizationId, userId });
    updateWorkspaceCache({ workspaceId: organizationId, userId: targetUser.id });
    updateTags([CACHE_OrganizationMembersTag(organizationId)]);

    return {
      success: true,
      data: {
        organizationId,
        userId: targetUser.id,
      },
    };
  },
  {
    actionName: "addWorkspaceMember",
    logger: workspacesLogger,
  }
);
