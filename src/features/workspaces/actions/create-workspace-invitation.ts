"use server";

import { forbidden } from "next/navigation";
import { headers } from "next/headers";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import prisma from "@server/prisma";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import {
  createWorkspaceInvitationSchema,
  type CreateWorkspaceInvitationInput,
} from "@features/workspaces/workspaces-invitations-schemas";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { findWorkspaceInvitationById } from "@features/workspaces/workspaces-invitations-repository";
import {
  updateWorkspaceInvitationCache,
  withResolvedWorkspaceInvitationDisplayStatus,
  type WorkspaceInvitationDto,
} from "@features/workspaces/workspaces-invitations-types";
import { resolveWorkspaceInvitationMutationError } from "@features/workspaces/workspaces-invitations-action-utils";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const createWorkspaceInvitation = createProtectedActionWithInput<
  CreateWorkspaceInvitationInput,
  WorkspaceInvitationDto
>(
  createWorkspaceInvitationSchema,
  async ({ organizationId, email }, { userId }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);

    if (!workspace) {
      forbidden();
    }

    const canCreateInvitations = await hasWorkspacePermission(organizationId, {
      invitation: ["create"],
    });

    if (!canCreateInvitations) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.invitationPermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    const [existingMember, existingInvitation] = await Promise.all([
      prisma.member.findFirst({
        where: {
          organizationId,
          user: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.invitation.findFirst({
        where: {
          organizationId,
          email,
          status: "pending",
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingMember) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.invitationRecipientAlreadyMember,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    if (existingInvitation) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.invitationAlreadyExists,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    try {
      const createdInvitation = await auth.api.createInvitation({
        body: {
          organizationId,
          email,
          role: "member",
        },
        headers: await headers(),
      });

      updateWorkspaceInvitationCache({
        invitationId: createdInvitation.id,
        organizationId,
        email,
      });

      const invitation = await findWorkspaceInvitationById(createdInvitation.id);

      if (!invitation) {
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
        data: withResolvedWorkspaceInvitationDisplayStatus(invitation),
      };
    } catch (error) {
      const resolvedError = resolveWorkspaceInvitationMutationError(error);

      if (resolvedError) {
        return {
          success: false,
          error: resolvedError,
        };
      }

      throw error;
    }
  },
  {
    actionName: "createWorkspaceInvitation",
    logger: workspacesLogger,
  }
);
