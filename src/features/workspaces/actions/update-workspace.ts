"use server";

import { HttpCodes } from "@typings/network";
import { type UpdateWorkspaceInput, updateWorkspaceSchema } from "../workspaces-schemas";
import { updateWorkspaceCache, WorkspaceWithCounts } from "../workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import { forbidden } from "next/navigation";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import prisma from "@server/prisma";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  findFirstAccessibleOrganizationByIdAndUserId,
  findManyAccessibleOrganizationsByUserId,
  findWorkspaceDtoByIdAndUserId,
  generateOrganizationSlug,
} from "@features/organizations/organizations-repository";

export const updateWorkspace = createProtectedActionWithInput<
  UpdateWorkspaceInput,
  WorkspaceWithCounts
>(
  updateWorkspaceSchema,
  async (input: UpdateWorkspaceInput, { userId, logger }) => {
    const { id, name, slug, isDefault } = input;
    const existingWorkspace = await findFirstAccessibleOrganizationByIdAndUserId(id, userId, {
      name: true,
      isDefault: true,
      slug: true,
    });

    if (!existingWorkspace) {
      forbidden();
    }

    if (name && name !== existingWorkspace.name) {
      const duplicateWorkspace = (await findManyAccessibleOrganizationsByUserId(userId)).find(
        (workspace) =>
          workspace.id !== id && workspace.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

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

    if (slug && slug !== existingWorkspace.slug) {
      const duplicateSlugWorkspace = (await findManyAccessibleOrganizationsByUserId(userId)).find(
        (workspace) => workspace.id !== id && workspace.slug === slug
      );

      if (duplicateSlugWorkspace) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.duplicateSlug,
            code: HttpCodes.CONFLICT,
          },
        };
      }
    }

    if (isDefault === true) {
      await prisma.organization.updateMany({
        where: {
          id: {
            not: id,
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

    await auth.api.updateOrganization({
      body: {
        organizationId: id,
        data: {
          ...(name
            ? {
                name,
              }
            : {}),
          ...((name || slug) && {
            slug:
              slug ??
              (await generateOrganizationSlug(name ?? existingWorkspace.name, {
                excludeOrganizationId: id,
              })),
          }),
          ...(isDefault !== undefined ? { isDefault } : {}),
        },
      },
      headers: await headers(),
    });

    logger.debug("Updated Workspace for user");

    updateWorkspaceCache({ workspaceId: id, userId });

    const workspace = await findWorkspaceDtoByIdAndUserId(id, userId);
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
    actionName: "updateWorkspace",
    logger: workspacesLogger,
  }
);
