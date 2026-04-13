import "server-only";

import { Logger } from "pino";
import { ActionResult } from "@typings/actions";
import prisma from "@server/prisma";
import { revalidateWorkspaceCache } from "@features/workspaces/workspaces-types";

export const createDefaultWorkspaceForUser = async (
  userId: string,
  logger: Logger
): Promise<ActionResult<void>> => {
  const count = await prisma.workspace.count({ where: { userId } });
  if (count > 0) return { success: true };

  const { id: workspaceId } = await prisma.workspace.create({
    data: {
      name: "Default",
      userId,
      isDefault: true,
    },
  });

  logger.debug("Created default workspace for user");

  revalidateWorkspaceCache({ workspaceId, userId });

  return {
    success: true,
  };
};
