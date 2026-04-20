"use server";

import { z } from "zod";
import prisma from "@server/prisma";
import { createProtectedActionWithInput } from "@lib/actions";
import { organizationsLogger } from "@features/organizations/organizations-logger";
import { findWorkspaceDtoByIdAndUserId } from "@features/organizations/organizations-repository";
import {
  updateWorkspaceCache,
  type WorkspaceWithCounts,
} from "@features/workspaces/workspaces-types";

const setDefaultOrganizationSchema = z.object({
  organizationId: z.string().cuid2(),
});

export const setDefaultOrganization = createProtectedActionWithInput<
  z.infer<typeof setDefaultOrganizationSchema>,
  WorkspaceWithCounts
>(
  setDefaultOrganizationSchema,
  async ({ organizationId }, { userId, logger }) => {
    const workspace = await findWorkspaceDtoByIdAndUserId(organizationId, userId);
    if (!workspace) {
      return {
        success: false,
        error: {
          message: "403",
          code: 403,
        },
      };
    }

    await prisma.organization.updateMany({
      where: {
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

    await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        isDefault: true,
      },
    });

    updateWorkspaceCache({ workspaceId: organizationId, userId });
    logger.debug({ organizationId }, "Updated default organization");

    return {
      success: true,
      data: {
        ...workspace,
        isDefault: true,
      },
    };
  },
  {
    actionName: "setDefaultOrganization",
    logger: organizationsLogger,
  }
);
