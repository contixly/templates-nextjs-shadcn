"use server";

import { headers } from "next/headers";
import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import {
  updateWorkspaceInvitationDecisionSchema,
  type UpdateWorkspaceInvitationDecisionInput,
} from "@features/workspaces/workspaces-invitations-schemas";
import {
  getWorkspaceInvitationDecisionError,
  resolveWorkspaceInvitationMutationError,
} from "@features/workspaces/workspaces-invitations-action-utils";
import { loadWorkspaceInvitationDecisionPageContext } from "@features/workspaces/workspaces-invitations";
import { updateWorkspaceInvitationCache } from "@features/workspaces/workspaces-invitations-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const rejectWorkspaceInvitation = createProtectedActionWithInput<
  UpdateWorkspaceInvitationDecisionInput,
  { invitationId: string }
>(
  updateWorkspaceInvitationDecisionSchema,
  async ({ invitationId }) => {
    const context = await loadWorkspaceInvitationDecisionPageContext(invitationId);

    if (!context) {
      return {
        success: false,
        error: {
          message: "validation.errors.invitationNotFound",
          code: HttpCodes.NOT_FOUND,
        },
      };
    }

    if (!context.canRespond) {
      return {
        success: false,
        error: getWorkspaceInvitationDecisionError(context.state),
      };
    }

    try {
      await auth.api.rejectInvitation({
        body: {
          invitationId,
        },
        headers: await headers(),
      });
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

    updateWorkspaceInvitationCache({
      invitationId,
      organizationId: context.invitation.organizationId,
      email: context.invitation.email,
    });

    return {
      success: true,
      data: {
        invitationId,
      },
    };
  },
  {
    actionName: "rejectWorkspaceInvitation",
    logger: workspacesLogger,
  }
);
