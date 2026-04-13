"use server";

import { HttpCodes } from "@typings/network";
import { type DeleteWorkspaceInput, deleteWorkspaceSchema } from "../workspaces-schemas";
import { createProtectedActionWithInput } from "@lib/actions";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import prisma from "@server/prisma";
import { findFirstWorkspaceByIdAndUserId } from "../workspaces-repository";
import { forbidden } from "next/navigation";
import { updateWorkspaceCache } from "@features/workspaces/workspaces-types";

/** Deletes a workspace row after ownership checks (see Prisma schema for cascade rules). */
export const deleteWorkspace = createProtectedActionWithInput<DeleteWorkspaceInput, void>(
  deleteWorkspaceSchema,
  async (input, { userId, logger }) => {
    const { id, confirmationText } = input;

    // 3. Verify Workspace ownership and get Workspace data
    const workspaceToDelete = await findFirstWorkspaceByIdAndUserId(id, userId, {
      name: true,
      isDefault: true,
    });

    if (!workspaceToDelete) {
      forbidden();
    }

    // 4. Check if last Workspace
    const workspaceCount = await prisma.workspace.count({
      where: { userId },
    });

    if (workspaceCount <= 1) {
      return {
        success: false,
        error: { message: "You must have at least one Workspace", code: HttpCodes.BAD_REQUEST },
      };
    }

    // 5. Check if default Workspace
    if (workspaceToDelete.isDefault) {
      return {
        success: false,
        error: {
          message: "Cannot delete default Workspace. Set another Workspace as default first.",
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    // 6. Validate confirmation text matched Workspace name (case-sensitive)
    if (confirmationText !== workspaceToDelete.name) {
      return {
        success: false,
        error: {
          message: "Confirmation text does not match workspace name",
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    // 7. Delete Workspace (cascade handled by Prisma)
    await prisma.workspace.delete({
      where: { id },
    });

    // 10. Revalidate cache
    updateWorkspaceCache({ workspaceId: id, userId });

    logger.warn("Deleted Workspace");

    // 11. Return success
    return {
      success: true,
      data: undefined,
    };
  },
  { actionName: "deleteWorkspace", logger: workspacesLogger }
);
