import "server-only";

import type { Prisma } from "@/prisma/generated/client";
import prisma from "@server/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { organizationsLogger } from "@features/organizations/organizations-logger";
import { toWorkspaceDto } from "@features/organizations/organizations-dto";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationsByUserIdTag,
  type OrganizationWorkspaceDto,
} from "@features/organizations/organizations-types";

const logger = organizationsLogger.child({ type: "repository" });

const workspaceSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  metadata: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const workspaceOrderBy = [
  { isDefault: "desc" },
  { name: "asc" },
  { id: "asc" },
] satisfies Prisma.OrganizationOrderByWithRelationInput[];

export const findManyAccessibleOrganizationsByUserId = async (
  userId: string
): Promise<OrganizationWorkspaceDto[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_OrganizationsByUserIdTag(userId));

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

  return organizations.map((organization) => toWorkspaceDto(organization));
};

export const findFirstAccessibleOrganizationByIdAndUserId = async (
  organizationId: string,
  userId: string,
  select?: Prisma.OrganizationSelect
) => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_OrganizationByIdTag(organizationId));

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

export const findDefaultOrganizationByUserId = async (userId: string) => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_OrganizationsByUserIdTag(userId));

  const organization = await prisma.organization.findFirst({
    where: {
      isDefault: true,
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: workspaceOrderBy,
    select: workspaceSelect,
  });

  return organization ? toWorkspaceDto(organization) : null;
};

export const findFirstAccessibleOrganizationForUser = async (userId: string) => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_OrganizationsByUserIdTag(userId));

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

  return organization ? toWorkspaceDto(organization) : null;
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
