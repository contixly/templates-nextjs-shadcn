import "server-only";

import type { Prisma } from "@/prisma/generated/client";
import {
  findFirstAccessibleOrganizationByIdAndUserId,
  findManyAccessibleOrganizationsByUserId,
} from "@features/organizations/organizations-repository";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

export const findManyWorkspacesByUserId = async (userId: string): Promise<WorkspaceWithCounts[]> =>
  findManyAccessibleOrganizationsByUserId(userId);

export const findFirstWorkspaceByIdAndUserId = async (
  id: string,
  userId: string,
  select?: Prisma.OrganizationSelect
) => findFirstAccessibleOrganizationByIdAndUserId(id, userId, select);
