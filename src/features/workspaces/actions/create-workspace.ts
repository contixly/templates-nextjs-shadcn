"use server";

import { HttpCodes } from "@typings/network";
import { type CreateWorkspaceInput, createWorkspaceSchema } from "../workspaces-schemas";
import { updateWorkspaceCache, WorkspaceWithCounts } from "../workspaces-types";
import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  findManyAccessibleOrganizationsByUserId,
  findWorkspaceDtoByIdAndUserId,
  generateOrganizationSlug,
} from "@features/organizations/organizations-repository";

const isUniqueConstraintError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Unique constraint failed") || message.includes("duplicate key");
};

const CREATE_WORKSPACE_MAX_SLUG_ATTEMPTS = 5;

export const createWorkspace = createProtectedActionWithInput<
  CreateWorkspaceInput,
  WorkspaceWithCounts
>(
  createWorkspaceSchema,
  async (input, { headers, userId, logger }) => {
    const { name } = input;

    const existingWorkspace = (await findManyAccessibleOrganizationsByUserId(userId)).find(
      (workspace) => workspace.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (existingWorkspace) {
      return {
        success: false,
        error: { message: WORKSPACE_ERROR_KEYS.duplicateName, code: HttpCodes.CONFLICT },
      };
    }

    let organization: { id: string } | null = null;

    for (let attempt = 0; attempt < CREATE_WORKSPACE_MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = await generateOrganizationSlug(name);

      try {
        organization = (await auth.api.createOrganization({
          body: {
            name,
            slug,
          },
          headers,
        })) as { id: string };
        break;
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }

    if (!organization) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.duplicateSlug,
          code: HttpCodes.CONFLICT,
        },
      };
    }

    await auth.api.setActiveOrganization({
      body: {
        organizationId: organization.id,
      },
      headers,
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
