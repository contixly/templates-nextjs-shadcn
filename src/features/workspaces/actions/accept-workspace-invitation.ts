"use server";

import { HttpCodes } from "@typings/network";
import { createProtectedActionWithInput } from "@lib/actions";
import { updateTags } from "@lib/cache";
import { auth } from "@server/auth";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import { CACHE_OrganizationMembersTag } from "@features/organizations/organizations-types";
import {
  type UpdateWorkspaceInvitationDecisionInput,
  updateWorkspaceInvitationDecisionSchema,
} from "@features/workspaces/workspaces-invitations-schemas";
import {
  getWorkspaceInvitationDecisionError,
  resolveWorkspaceInvitationMutationError,
} from "@features/workspaces/workspaces-invitations-action-utils";
import { loadWorkspaceInvitationDecisionPageContext } from "@features/workspaces/workspaces-invitations";
import { updateWorkspaceInvitationCache } from "@features/workspaces/workspaces-invitations-types";
import {
  updateWorkspaceCache,
  type WorkspaceWithCounts,
} from "@features/workspaces/workspaces-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { updateWorkspaceTeamCache } from "@features/workspaces/workspaces-teams-types";

export const acceptWorkspaceInvitation = createProtectedActionWithInput<
  UpdateWorkspaceInvitationDecisionInput,
  WorkspaceWithCounts
>(
  updateWorkspaceInvitationDecisionSchema,
  async ({ invitationId }, { userId, headers }) => {
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
      await auth.api.acceptInvitation({
        body: {
          invitationId,
        },
        headers,
      });

      await auth.api.setActiveOrganization({
        body: {
          organizationId: context.invitation.organizationId,
        },
        headers,
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
    updateWorkspaceCache({ workspaceId: context.invitation.organizationId, userId });
    updateWorkspaceTeamCache({
      organizationId: context.invitation.organizationId,
      teamId: context.invitation.teamId,
      userIds: [userId],
    });
    updateTags([CACHE_OrganizationMembersTag(context.invitation.organizationId)]);

    const workspace = await findWorkspaceDtoByIdAndUserId(
      context.invitation.organizationId,
      userId
    );

    if (!workspace) {
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
      data: workspace as WorkspaceWithCounts,
    };
  },
  {
    actionName: "acceptWorkspaceInvitation",
    logger: workspacesLogger,
  }
);
