"use server";

import { z } from "zod";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { createProtectedActionWithInput } from "@lib/actions";
import { organizationsLogger } from "@features/organizations/organizations-logger";

const setActiveOrganizationSchema = z.object({
  organizationId: z.string().cuid2(),
});

export const setActiveOrganization = createProtectedActionWithInput<
  z.infer<typeof setActiveOrganizationSchema>,
  { organizationId: string }
>(
  setActiveOrganizationSchema,
  async ({ organizationId }, { logger }) => {
    await auth.api.setActiveOrganization({
      body: {
        organizationId,
      },
      headers: await headers(),
    });

    logger.debug({ organizationId }, "Updated active organization");

    return {
      success: true,
      data: {
        organizationId,
      },
    };
  },
  {
    actionName: "setActiveOrganization",
    logger: organizationsLogger,
  }
);
