import { revalidateTags, updateTags } from "@lib/cache";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationMembersTag,
  CACHE_OrganizationsByUserIdTag,
} from "@features/organizations/organizations-types";
export {
  normalizeWorkspaceTeamName,
  normalizeWorkspaceTeamNameForComparison,
} from "@features/workspaces/workspaces-teams-utils";

export interface WorkspaceTeamListItemDto {
  id: string;
  organizationId: string;
  name: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceTeamMemberDto {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  roleLabels: string[];
  joinedAt: Date;
  teamJoinedAt: Date;
}

export interface WorkspaceTeamAssignableMemberDto {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  roleLabels: string[];
  joinedAt: Date;
}

export const CACHE_WorkspaceTeamsTag = (organizationId: string) =>
  `organization_${organizationId}_teams`;

export const CACHE_WorkspaceTeamByIdTag = (teamId: string) => `workspace_team_${teamId}`;

export const CACHE_WorkspaceTeamMembersTag = (teamId: string) => `workspace_team_${teamId}_members`;

const getWorkspaceTeamCacheTags = ({
  organizationId,
  teamId,
  userIds = [],
}: {
  organizationId?: string | null;
  teamId?: string | null;
  userIds?: Array<string | null | undefined>;
}) =>
  Array.from(
    new Set([
      ...(organizationId
        ? [
            CACHE_WorkspaceTeamsTag(organizationId),
            CACHE_OrganizationByIdTag(organizationId),
            CACHE_OrganizationMembersTag(organizationId),
          ]
        : []),
      ...(teamId
        ? [CACHE_WorkspaceTeamByIdTag(teamId), CACHE_WorkspaceTeamMembersTag(teamId)]
        : []),
      ...userIds.flatMap((userId) => (userId ? [CACHE_OrganizationsByUserIdTag(userId)] : [])),
    ])
  );

export const updateWorkspaceTeamCache = (options: {
  organizationId?: string | null;
  teamId?: string | null;
  userIds?: Array<string | null | undefined>;
}) => updateTags(getWorkspaceTeamCacheTags(options));

export const revalidateWorkspaceTeamCache = (options: {
  organizationId?: string | null;
  teamId?: string | null;
  userIds?: Array<string | null | undefined>;
}) => revalidateTags(getWorkspaceTeamCacheTags(options));
