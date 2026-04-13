"use server";

import { HttpCodes } from "@typings/network";
import { type CreateWorkspaceInput, createWorkspaceSchema } from "../workspaces-schemas";
import { updateWorkspaceCache, WorkspaceWithCounts } from "../workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import prisma from "@server/prisma";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";

export const createWorkspace = createProtectedActionWithInput<
  CreateWorkspaceInput,
  WorkspaceWithCounts
>(
  createWorkspaceSchema,
  async (input, { userId, logger }) => {
    const { name, isDefault } = input;

    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        userId,
        name: { mode: "insensitive", equals: name },
      },
      select: { id: true },
    });

    if (existingWorkspace) {
      return {
        success: false,
        error: { message: "A Workspace with this name already exists", code: HttpCodes.CONFLICT },
      };
    }

    // 4. Create a Workspace with transaction for default handling
    const newWorkspace = await prisma.$transaction(async (tx) => {
      // If setting as default, unset previous default
      if (isDefault) {
        await tx.workspace.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create a new Workspace
      return tx.workspace.create({
        data: {
          name,
          userId,
          isDefault: isDefault || false,
        },
      });
    });

    logger.debug("Created new Workspace for user");

    // 5. Add placeholder counts
    const workspaceWithCounts: WorkspaceWithCounts = {
      ...newWorkspace,
      _count: {
        notes: 0,
        tasks: 0,
        goals: 0,
      },
    };

    // 6. Revalidate cache
    updateWorkspaceCache({ workspaceId: newWorkspace.id, userId });

    // 7. Return success with data
    return {
      success: true,
      data: workspaceWithCounts,
    };
  },
  {
    actionName: "createWorkspace",
    validationErrorMessage: "Workspace name is required",
    logger: workspacesLogger,
  }
);
