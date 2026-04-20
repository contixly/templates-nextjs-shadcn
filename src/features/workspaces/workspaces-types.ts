import { updateTag } from "next/cache";
import { revalidateTags } from "@lib/cache";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationsByUserIdTag,
  type OrganizationWorkspaceDto,
} from "@features/organizations/organizations-types";

/** Alias kept for current UI call sites while the tenant model moves to organizations. */
export type WorkspaceWithCounts = OrganizationWorkspaceDto;

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
  updateTag(CACHE_OrganizationsByUserIdTag(userId));
  updateTag(CACHE_OrganizationByIdTag(workspaceId));
};

export const revalidateWorkspaceCache = ({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) => {
  revalidateTags([
    CACHE_WorkspacesByUserIdTag(userId),
    CACHE_WorkspaceByIdTag(workspaceId),
    CACHE_OrganizationsByUserIdTag(userId),
    CACHE_OrganizationByIdTag(workspaceId),
  ]);
};
