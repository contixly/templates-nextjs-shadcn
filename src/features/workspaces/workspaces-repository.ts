import "server-only";

import { Workspace } from "@/prisma/generated/client";
import prisma from "@server/prisma";
import { cacheLife, cacheTag } from "next/cache";
import {
  CACHE_WorkspaceByIdTag,
  CACHE_WorkspacesByUserIdTag,
  type WorkspaceWithCounts,
} from "@features/workspaces/workspaces-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WorkspaceSelect } from "@/prisma/generated/models/Workspace";

/**
 * Repository-scoped logger to keep data-access logs filterable and separate from
 * action/UI logs for the workspaces feature.
 */
const logger = workspacesLogger.child({ type: "repository" });

/**
 * Returns all workspaces owned by a user, ordered for UI consumption: default
 * workspace first, then name A→Z.
 *
 * Cached per user to avoid repeated list queries; mutations should invalidate the
 * `CACHE_WorkspacesByUserIdTag` tag to refresh this list.
 */
export const findManyWorkspacesByUserId = async (
  userId: string
): Promise<WorkspaceWithCounts[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_WorkspacesByUserIdTag(userId));

  logger
    .child({ function: "findManyWorkspacesByUserId", userId })
    .debug("Fetching workspaces for user");

  return prisma.workspace.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
};

/**
 * Fetches a single workspace only if it belongs to the user (tenant boundary).
 * The caller can request a partial selection, but `id` is always included, so
 * downstream code can rely on a stable identifier.
 *
 * Cached per workspace id; invalidate `CACHE_WorkspaceByIdTag` after updates.
 */
export const findFirstWorkspaceByIdAndUserId = async (
  id: string,
  userId: string,
  select?: WorkspaceSelect
): Promise<Partial<Workspace> | null> => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_WorkspaceByIdTag(id));

  logger
    .child({ function: "findFirstWorkspaceByIdAndUserId", id, userId, select })
    .debug("Find workspace by id for user with selected fields");

  return prisma.workspace.findFirst({
    where: {
      id,
      userId,
    },
    select: { id: true, ...(select ?? {}) },
  });
};
