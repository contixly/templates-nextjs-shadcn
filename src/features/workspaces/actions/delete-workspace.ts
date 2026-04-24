"use server";

import { HttpCodes } from "@typings/network";
import { type DeleteWorkspaceInput, deleteWorkspaceSchema } from "../workspaces-schemas";
import { createProtectedActionWithInput } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { forbidden } from "next/navigation";
import { updateWorkspaceCache } from "@features/workspaces/workspaces-types";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  countAccessibleOrganizationsByUserId,
  findFirstAccessibleOrganizationByIdAndUserId,
} from "@features/organizations/organizations-repository";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";

/** Deletes a workspace row after ownership checks (see Prisma schema for cascade rules). */
export const deleteWorkspace = createProtectedActionWithInput<DeleteWorkspaceInput, void>(
  deleteWorkspaceSchema,
  async (input, { userId, logger }) => {
    const { id, confirmationText } = input;

    // 3. Verify Workspace ownership and get Workspace data
    const workspaceToDelete = await findFirstAccessibleOrganizationByIdAndUserId(id, userId, {
      name: true,
      isDefault: true,
    });

    if (!workspaceToDelete) {
      forbidden();
    }

    const canDeleteWorkspace = await hasWorkspacePermission(id, {
      organization: ["delete"],
    });

    if (!canDeleteWorkspace) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.deletePermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
    }

    const workspaceCount = await countAccessibleOrganizationsByUserId(userId);

    if (workspaceCount <= 1) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.atLeastOneWorkspace,
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    // 5. Check if default Workspace
    if (workspaceToDelete.isDefault) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.defaultWorkspaceDeletionForbidden,
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    // 6. Validate confirmation text matched Workspace name (case-sensitive)
    if (confirmationText !== workspaceToDelete.name) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.confirmationMismatch,
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    await auth.api.deleteOrganization({
      body: {
        organizationId: id,
      },
      headers: await headers(),
    });

    updateWorkspaceCache({ workspaceId: id, userId });

    logger.warn("Deleted Workspace");

    return {
      success: true,
      data: undefined,
    };
  },
  { actionName: "deleteWorkspace", logger: workspacesLogger }
);
