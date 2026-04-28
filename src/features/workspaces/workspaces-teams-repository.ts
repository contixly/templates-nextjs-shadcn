import "server-only";

import type { Prisma } from "@/prisma/generated/client";
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@server/prisma";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationMembersTag,
  CACHE_OrganizationsByUserIdTag,
} from "@features/organizations/organizations-types";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import {
  CACHE_WorkspaceTeamByIdTag,
  CACHE_WorkspaceTeamMembersTag,
  CACHE_WorkspaceTeamsTag,
  type WorkspaceTeamAssignableMemberDto,
  type WorkspaceTeamListItemDto,
  type WorkspaceTeamMemberDto,
} from "@features/workspaces/workspaces-teams-types";
import { normalizeWorkspaceTeamNameForComparison } from "@features/workspaces/workspaces-teams-utils";

const logger = workspacesLogger.child({ type: "repository", module: "workspace-teams" });

const teamListSelect = {
  id: true,
  organizationId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      members: true,
    },
  },
} satisfies Prisma.TeamSelect;

type TeamListRecord = Prisma.TeamGetPayload<{
  select: typeof teamListSelect;
}>;

const teamOrderBy = [
  { name: "asc" },
  { id: "asc" },
] satisfies Prisma.TeamOrderByWithRelationInput[];

const teamMemberOrderBy = [
  { user: { name: "asc" } },
  { user: { email: "asc" } },
  { userId: "asc" },
] satisfies Prisma.TeamMemberOrderByWithRelationInput[];

const workspaceMemberOrderBy = [
  { user: { name: "asc" } },
  { user: { email: "asc" } },
  { userId: "asc" },
] satisfies Prisma.MemberOrderByWithRelationInput[];

const splitRoleLabels = (role?: string | null) =>
  Array.from(
    new Set(
      (role ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

const toWorkspaceTeamListItemDto = (team: TeamListRecord): WorkspaceTeamListItemDto => ({
  id: team.id,
  organizationId: team.organizationId,
  name: team.name,
  memberCount: team._count.members,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt,
});

const toWorkspaceTeamMemberDto = (member: {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image?: string | null;
    members: Array<{
      role: string;
      createdAt: Date;
    }>;
  };
}): WorkspaceTeamMemberDto => {
  const workspaceMember = member.user.members[0] ?? null;

  return {
    id: member.id,
    teamId: member.teamId,
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    image: member.user.image ?? null,
    role: workspaceMember?.role ?? null,
    roleLabels: splitRoleLabels(workspaceMember?.role),
    joinedAt: workspaceMember?.createdAt ?? member.createdAt,
    teamJoinedAt: member.createdAt,
  };
};

const toWorkspaceTeamAssignableMemberDto = (member: {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}): WorkspaceTeamAssignableMemberDto => ({
  memberId: member.id,
  userId: member.userId,
  name: member.user.name,
  email: member.user.email,
  image: member.user.image ?? null,
  role: member.role,
  roleLabels: splitRoleLabels(member.role),
  joinedAt: member.createdAt,
});

export const findManyWorkspaceTeamsByOrganizationIdAndUserId = async (
  organizationId: string,
  userId: string
): Promise<WorkspaceTeamListItemDto[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_WorkspaceTeamsTag(organizationId),
    CACHE_OrganizationByIdTag(organizationId),
    CACHE_OrganizationMembersTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  logger
    .child({
      function: "findManyWorkspaceTeamsByOrganizationIdAndUserId",
      organizationId,
      userId,
    })
    .debug("Fetching workspace teams");

  const teams = await prisma.team.findMany({
    where: {
      organizationId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    orderBy: teamOrderBy,
    select: teamListSelect,
  });

  if (teams.length > 0) {
    cacheTag(
      ...teams.flatMap((team) => [
        CACHE_WorkspaceTeamByIdTag(team.id),
        CACHE_WorkspaceTeamMembersTag(team.id),
      ])
    );
  }

  return teams.map(toWorkspaceTeamListItemDto);
};

export const findWorkspaceTeamByIdAndOrganizationIdAndUserId = async (
  teamId: string,
  organizationId: string,
  userId: string
): Promise<WorkspaceTeamListItemDto | null> => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_WorkspaceTeamsTag(organizationId),
    CACHE_WorkspaceTeamByIdTag(teamId),
    CACHE_OrganizationByIdTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    select: teamListSelect,
  });

  return team ? toWorkspaceTeamListItemDto(team) : null;
};

export const findManyWorkspaceTeamMembersByTeamIdAndUserId = async (
  teamId: string,
  organizationId: string,
  userId: string
): Promise<WorkspaceTeamMemberDto[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_WorkspaceTeamsTag(organizationId),
    CACHE_WorkspaceTeamByIdTag(teamId),
    CACHE_WorkspaceTeamMembersTag(teamId),
    CACHE_OrganizationMembersTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
      team: {
        organizationId,
        organization: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    orderBy: teamMemberOrderBy,
    select: {
      id: true,
      teamId: true,
      userId: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          members: {
            where: {
              organizationId,
            },
            select: {
              role: true,
              createdAt: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  return members.map(toWorkspaceTeamMemberDto);
};

export const findManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId = async (
  organizationId: string,
  userId: string
): Promise<WorkspaceTeamAssignableMemberDto[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_OrganizationByIdTag(organizationId),
    CACHE_OrganizationMembersTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  const members = await prisma.member.findMany({
    where: {
      organizationId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    orderBy: workspaceMemberOrderBy,
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return members.map(toWorkspaceTeamAssignableMemberDto);
};

export const findWorkspaceTeamByOrganizationIdAndNormalizedName = async ({
  organizationId,
  name,
  excludeTeamId,
}: {
  organizationId: string;
  name: string;
  excludeTeamId?: string | null;
}) =>
  prisma.team.findFirst({
    where: {
      organizationId,
      name: {
        equals: normalizeWorkspaceTeamNameForComparison(name),
        mode: "insensitive",
      },
      ...(excludeTeamId ? { NOT: { id: excludeTeamId } } : {}),
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

export const findWorkspaceTeamOwnership = async (teamId: string, organizationId: string) =>
  prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

export const findWorkspaceTeamMembership = async (teamId: string, userId: string) =>
  prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
    },
    select: {
      id: true,
      teamId: true,
      userId: true,
    },
  });
