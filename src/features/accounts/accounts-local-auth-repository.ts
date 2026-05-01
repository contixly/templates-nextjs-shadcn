import "server-only";

import prisma from "@server/prisma";

export const findSoleMemberOrganizationIdsForUser = async (userId: string) => {
  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return organizations
    .filter((organization) => organization._count.members === 1)
    .map((organization) => organization.id);
};

export const deleteSoleMemberOrganizationsForUser = async (
  userId: string,
  organizationIds: string[]
) => {
  if (organizationIds.length === 0) {
    return { count: 0 };
  }

  return prisma.organization.deleteMany({
    where: {
      id: {
        in: organizationIds,
      },
      members: {
        some: {
          userId,
        },
        every: {
          userId,
        },
      },
    },
  });
};

export const deleteMemberlessOrganizationsByIds = async (organizationIds: string[]) => {
  if (organizationIds.length === 0) {
    return { count: 0 };
  }

  return prisma.organization.deleteMany({
    where: {
      id: {
        in: organizationIds,
      },
      members: {
        none: {},
      },
    },
  });
};
