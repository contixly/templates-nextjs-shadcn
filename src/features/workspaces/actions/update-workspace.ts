"use server";

import { HttpCodes } from "@typings/network";
import { type UpdateWorkspaceInput, updateWorkspaceSchema } from "../workspaces-schemas";
import { updateWorkspaceCache, WorkspaceWithCounts } from "../workspaces-types";
import { updateTags } from "@lib/cache";
import { createProtectedActionWithInput } from "@lib/actions";
import { forbidden } from "next/navigation";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  findFirstAccessibleOrganizationByIdAndUserId,
  findManyAccessibleOrganizationsByUserId,
  findOrganizationBySlug,
  findWorkspaceDtoByIdAndUserId,
} from "@features/organizations/organizations-repository";
import { CACHE_OrganizationMembersTag } from "@features/organizations/organizations-types";
import { mergeWorkspaceAllowedEmailDomainsMetadata } from "@features/workspaces/workspaces-domain-restrictions";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";

export const updateWorkspace = createProtectedActionWithInput<
  UpdateWorkspaceInput,
  WorkspaceWithCounts
>(
  updateWorkspaceSchema,
  async (input: UpdateWorkspaceInput, { userId, logger }) => {
    const { id, name, slug, allowedEmailDomains } = input;
    const existingWorkspace = await findFirstAccessibleOrganizationByIdAndUserId(id, userId, {
      name: true,
      slug: true,
      metadata: true,
    });

    if (!existingWorkspace) {
      forbidden();
    }

    const canUpdateWorkspace = await hasWorkspacePermission(id, {
      organization: ["update"],
    });

    if (!canUpdateWorkspace) {
      return {
        success: false,
        error: {
          message: WORKSPACE_ERROR_KEYS.updatePermissionDenied,
          code: HttpCodes.FORBIDDEN,
        },
      };
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
      const duplicateSlugWorkspace = await findOrganizationBySlug(slug, { id: true });

      if (duplicateSlugWorkspace && duplicateSlugWorkspace.id !== id) {
        return {
          success: false,
          error: {
            message: WORKSPACE_ERROR_KEYS.duplicateSlug,
            code: HttpCodes.CONFLICT,
          },
        };
      }
    }

    const nextMetadata =
      allowedEmailDomains !== undefined
        ? mergeWorkspaceAllowedEmailDomainsMetadata(existingWorkspace.metadata, allowedEmailDomains)
        : undefined;

    await auth.api.updateOrganization({
      body: {
        organizationId: id,
        data: {
          ...(name
            ? {
                name,
              }
            : {}),
          ...(slug !== undefined
            ? {
                slug,
              }
            : {}),
          ...(nextMetadata !== undefined
            ? {
                metadata: nextMetadata,
              }
            : {}),
        },
      },
      headers: await headers(),
    });

    logger.debug("Updated Workspace for user");

    updateWorkspaceCache({ workspaceId: id, userId });
    if (allowedEmailDomains !== undefined) {
      updateTags([CACHE_OrganizationMembersTag(id)]);
    }

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
