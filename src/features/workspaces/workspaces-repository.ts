import "server-only";

import { Workspace } from "@/prisma/generated/client";
import prisma from "@server/prisma";
import { cacheLife, cacheTag } from "next/cache";
import {
  CACHE_WorkspaceByIdTag,
  CACHE_WorkspacesByUserIdTag,
  WorkspaceWithCounts,
} from "@features/workspaces/workspaces-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import { WorkspaceSelect } from "@/prisma/generated/models/Workspace";

/**
 * Repository-scoped logger to keep data-access logs filterable and separate from
 * action/UI logs for the workspaces feature.
 */
const logger = workspacesLogger.child({ type: "repository" });

const withDefaultCounts = <T extends Workspace>(workspace: T): WorkspaceWithCounts => ({
  ...workspace,
  _count: {
    notes: 0,
    tasks: 0,
    goals: 0,
  },
});

/**
 * Returns all workspaces owned by a user, ordered for UI consumption: default
 * workspace first, then name A→Z. Includes note counts for sidebar badges.
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
    .debug("Fetching workspaces for user with counts");

  const workspaces = await prisma.workspace.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return workspaces.map(withDefaultCounts);
};

/**
 * Fetches a single workspace only if it belongs to the user (tenant boundary).
 * The caller can request a partial selection, but `id` is always included so
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

/**
 * Same as `findFirstWorkspaceByIdAndUserId`, but includes relation counts used
 * for UI badges (currently notes). Selection is merged with counts and `id`.
 */
export const findFirstWorkspaceByIdAndUserIdWithCounts = async (
  id: string,
  userId: string,
  select?: WorkspaceSelect
): Promise<WorkspaceWithCounts | null> => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_WorkspaceByIdTag(id));

  logger
    .child({ function: "findFirstWorkspaceByIdAndUserIdWithCounts", id, userId, select })
    .debug("Fetching workspace by id for user with selected fields and counts");

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      ...(select ?? {}),
    },
  });

  if (!workspace) {
    return null;
  }

  return withDefaultCounts(workspace as Workspace);
};
