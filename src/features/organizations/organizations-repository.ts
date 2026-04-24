import "server-only";

import type { Prisma } from "@/prisma/generated/client";
import prisma from "@server/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { organizationsLogger } from "@features/organizations/organizations-logger";
import {
  toOrganizationMemberListItemDto,
  toWorkspaceDto,
} from "@features/organizations/organizations-dto";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationMembersTag,
  CACHE_OrganizationsByUserIdTag,
  type OrganizationMemberListItemDto,
  type OrganizationWorkspaceDto,
} from "@features/organizations/organizations-types";

const logger = organizationsLogger.child({ type: "repository" });

const workspaceSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const workspaceOrderBy = [
  { name: "asc" },
  { id: "asc" },
] satisfies Prisma.OrganizationOrderByWithRelationInput[];

const memberSelect = {
  id: true,
  userId: true,
  role: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} satisfies Prisma.MemberSelect;

const memberOrderBy = [
  { createdAt: "asc" },
  { id: "asc" },
] satisfies Prisma.MemberOrderByWithRelationInput[];

const getAccessibleOrganizationCacheTags = (
  userId: string,
  organizationIds: Array<string | null | undefined> = []
) =>
  Array.from(
    new Set([
      CACHE_OrganizationsByUserIdTag(userId),
      ...organizationIds.flatMap((organizationId) =>
        organizationId ? [CACHE_OrganizationByIdTag(organizationId)] : []
      ),
    ])
  );

const tagAccessibleOrganizationsCache = (
  userId: string,
  organizationIds: Array<string | null | undefined> = []
) => {
  cacheTag(...getAccessibleOrganizationCacheTags(userId, organizationIds));
};

export const findManyAccessibleOrganizationsByUserId = async (
  userId: string
): Promise<OrganizationWorkspaceDto[]> => {
  "use cache";
  cacheLife("hours");

  logger
    .child({ function: "findManyAccessibleOrganizationsByUserId", userId })
    .debug("Fetching accessible organizations");

  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: workspaceOrderBy,
    select: workspaceSelect,
  });

  tagAccessibleOrganizationsCache(
    userId,
    organizations.map((organization) => organization.id)
  );

  return organizations.map((organization) => toWorkspaceDto(organization));
};

export const findFirstAccessibleOrganizationByIdAndUserId = async (
  organizationId: string,
  userId: string,
  select?: Prisma.OrganizationSelect
) => {
  "use cache";
  cacheLife("hours");
  cacheTag(...getAccessibleOrganizationCacheTags(userId, [organizationId]));

  logger
    .child({
      function: "findFirstAccessibleOrganizationByIdAndUserId",
      organizationId,
      userId,
    })
    .debug("Fetching accessible organization by id");

  return prisma.organization.findFirst({
    where: {
      id: organizationId,
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      ...(select ?? {}),
    },
  });
};

export const findFirstAccessibleOrganizationByKeyAndUserId = async (
  organizationKey: string,
  userId: string,
  select?: Prisma.OrganizationSelect
) => {
  "use cache";
  cacheLife("hours");

  logger
    .child({
      function: "findFirstAccessibleOrganizationByKeyAndUserId",
      organizationKey,
      userId,
    })
    .debug("Fetching accessible organization by route key");

  const organization = await prisma.organization.findFirst({
    where: {
      OR: [{ id: organizationKey }, { slug: organizationKey }],
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      slug: true,
      ...(select ?? {}),
    },
  });

  tagAccessibleOrganizationsCache(userId, [organization?.id]);

  return organization;
};

export const findFirstAccessibleOrganizationForUser = async (userId: string) => {
  "use cache";
  cacheLife("hours");

  const organization = await prisma.organization.findFirst({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: workspaceOrderBy,
    select: workspaceSelect,
  });

  tagAccessibleOrganizationsCache(userId, [organization?.id]);

  return organization ? toWorkspaceDto(organization) : null;
};

export const findManyAccessibleOrganizationMembersByIdAndUserId = async (
  organizationId: string,
  userId: string
): Promise<OrganizationMemberListItemDto[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_OrganizationByIdTag(organizationId),
    CACHE_OrganizationMembersTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  logger
    .child({
      function: "findManyAccessibleOrganizationMembersByIdAndUserId",
      organizationId,
      userId,
    })
    .debug("Fetching accessible organization members");

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
    orderBy: memberOrderBy,
    select: memberSelect,
  });

  return members.map((member) => toOrganizationMemberListItemDto(member));
};

export const findOrganizationMemberByOrganizationIdAndUserId = async (
  organizationId: string,
  userId: string,
  select?: Prisma.MemberSelect
) => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_OrganizationByIdTag(organizationId),
    CACHE_OrganizationMembersTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  return prisma.member.findFirst({
    where: {
      organizationId,
      userId,
    },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      ...(select ?? {}),
    },
  });
};

export const countAccessibleOrganizationsByUserId = async (userId: string) =>
  prisma.organization.count({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
  });

export const generateOrganizationSlug = async (
  name: string,
  options?: { excludeOrganizationId?: string }
) => {
  const baseSlug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
      .slice(0, 48) || "workspace";

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingOrganization = await prisma.organization.findUnique({
      where: {
        slug: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existingOrganization || existingOrganization.id === options?.excludeOrganizationId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

export const findWorkspaceDtoByIdAndUserId = async (
  organizationId: string,
  userId: string
): Promise<OrganizationWorkspaceDto | null> => {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      members: {
        some: {
          userId,
        },
      },
    },
    select: workspaceSelect,
  });

  return organization ? toWorkspaceDto(organization) : null;
};

export const findWorkspaceDtoByKeyAndUserId = async (
  organizationKey: string,
  userId: string
): Promise<OrganizationWorkspaceDto | null> => {
  const organization = await prisma.organization.findFirst({
    where: {
      OR: [{ id: organizationKey }, { slug: organizationKey }],
      members: {
        some: {
          userId,
        },
      },
    },
    select: workspaceSelect,
  });

  return organization ? toWorkspaceDto(organization) : null;
};
