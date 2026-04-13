import { Workspace } from "@/prisma/generated/client";
import { updateTag } from "next/cache";
import { revalidateTags } from "@lib/cache";

/** Alias kept for call sites; the schema currently has no per-workspace relation counts. */
export type WorkspaceWithCounts = Workspace;

export const CACHE_WorkspacesByUserIdTag = (userId: string) => `workspaces_user_${userId}`;
export const CACHE_WorkspaceByIdTag = (workspaceId: string) => `workspace_${workspaceId}`;

export const updateWorkspaceCache = ({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) => {
  updateTag(CACHE_WorkspacesByUserIdTag(userId));
  updateTag(CACHE_WorkspaceByIdTag(workspaceId));
};

export const revalidateWorkspaceCache = ({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) => {
  revalidateTags([CACHE_WorkspacesByUserIdTag(userId), CACHE_WorkspaceByIdTag(workspaceId)]);
};
