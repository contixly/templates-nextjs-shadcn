import { revalidateTags, updateTags } from "@lib/cache";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationsByUserIdTag,
  type OrganizationWorkspaceDto,
} from "@features/organizations/organizations-types";

/** Alias kept for current UI call sites while the tenant model moves to organizations. */
export type WorkspaceWithCounts = OrganizationWorkspaceDto;

export const CACHE_WorkspacesByUserIdTag = CACHE_OrganizationsByUserIdTag;
export const CACHE_WorkspaceByIdTag = CACHE_OrganizationByIdTag;

const getWorkspaceCacheTags = ({ userId, workspaceId }: { userId: string; workspaceId: string }) =>
  Array.from(
    new Set([
      CACHE_WorkspacesByUserIdTag(userId),
      CACHE_WorkspaceByIdTag(workspaceId),
      CACHE_OrganizationsByUserIdTag(userId),
      CACHE_OrganizationByIdTag(workspaceId),
    ])
  );

export const updateWorkspaceCache = ({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) => updateTags(getWorkspaceCacheTags({ userId, workspaceId }));

export const revalidateWorkspaceCache = ({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) => revalidateTags(getWorkspaceCacheTags({ userId, workspaceId }));
