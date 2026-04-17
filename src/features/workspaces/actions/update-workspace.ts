"use server";

import { HttpCodes } from "@typings/network";
import { type UpdateWorkspaceInput, updateWorkspaceSchema } from "../workspaces-schemas";
import { updateWorkspaceCache, WorkspaceWithCounts } from "../workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import { findFirstWorkspaceByIdAndUserId } from "@features/workspaces/workspaces-repository";
import { forbidden } from "next/navigation";
import prisma from "@server/prisma";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";

export const updateWorkspace = createProtectedActionWithInput<
  UpdateWorkspaceInput,
  WorkspaceWithCounts
>(
  updateWorkspaceSchema,
  async (input: UpdateWorkspaceInput, { userId, logger }) => {
    const { id, name, isDefault } = input;
    const existingWorkspace = await findFirstWorkspaceByIdAndUserId(id, userId, {
      name: true,
    });

    if (!existingWorkspace) {
      forbidden();
    }

    // If a name is provided, check uniqueness (excluding current Workspace)
    if (name && name !== existingWorkspace.name) {
      // TODO check for duplicate name in lowercase in db and input
      const duplicateWorkspace = await prisma.workspace.findFirst({
        where: {
          userId,
          name: { mode: "insensitive", equals: name },
          id: { not: id },
        },
        select: { id: true },
      });

      if (duplicateWorkspace) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.duplicateName,
            code: HttpCodes.CONFLICT,
          },
        };
      }
    }

    // Update Workspace with transaction for default handling
    const updatedWorkspace = await prisma.$transaction(async (tx) => {
      // If setting as default, unset previous default
      if (isDefault === true) {
        await tx.workspace.updateMany({
          where: {
            userId,
            isDefault: true,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update Workspace
      return tx.workspace.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(isDefault !== undefined && { isDefault }),
        },
      });
    });

    logger.debug("Updated Workspace for user");

    // 8. Revalidate cache
    updateWorkspaceCache({ workspaceId: id, userId });

    // 9. Return success with data
    return {
      success: true,
      data: updatedWorkspace,
    };
  },
  {
    actionName: "updateWorkspace",
    logger: workspacesLogger,
  }
);
