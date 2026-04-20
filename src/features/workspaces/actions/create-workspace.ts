"use server";

import { HttpCodes } from "@typings/network";
import { type CreateWorkspaceInput, createWorkspaceSchema } from "../workspaces-schemas";
import { updateWorkspaceCache, WorkspaceWithCounts } from "../workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import prisma from "@server/prisma";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  findManyAccessibleOrganizationsByUserId,
  findWorkspaceDtoByIdAndUserId,
  generateOrganizationSlug,
} from "@features/organizations/organizations-repository";

export const createWorkspace = createProtectedActionWithInput<
  CreateWorkspaceInput,
  WorkspaceWithCounts
>(
  createWorkspaceSchema,
  async (input, { userId, logger }) => {
    const { name, isDefault } = input;

    const existingWorkspace = (await findManyAccessibleOrganizationsByUserId(userId)).find(
      (workspace) => workspace.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (existingWorkspace) {
      return {
        success: false,
        error: { message: WORKSPACE_ERROR_KEYS.duplicateName, code: HttpCodes.CONFLICT },
      };
    }

    const slug = await generateOrganizationSlug(name);
    const organization = await auth.api.createOrganization({
      body: {
        name,
        slug,
        isDefault: isDefault || false,
      },
      headers: await headers(),
    });

    if (isDefault) {
      await prisma.organization.updateMany({
        where: {
          id: {
            not: organization.id,
          },
          isDefault: true,
          members: {
            some: {
              userId,
            },
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    await auth.api.setActiveOrganization({
      body: {
        organizationId: organization.id,
      },
      headers: await headers(),
    });

    logger.debug("Created new Workspace for user");

    updateWorkspaceCache({ workspaceId: organization.id, userId });

    const workspace = await findWorkspaceDtoByIdAndUserId(organization.id, userId);
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
    actionName: "createWorkspace",
    validationErrorMessage: WORKSPACE_ERROR_KEYS.nameRequired,
    logger: workspacesLogger,
  }
);
