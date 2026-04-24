"use server";

import { z } from "zod";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { createProtectedActionWithInput } from "@lib/actions";
import { organizationsLogger } from "@features/organizations/organizations-logger";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";

const setActiveOrganizationSchema = z.object({
  organizationId: organizationIdSchema,
});

export const setActiveOrganization = createProtectedActionWithInput<
  z.infer<typeof setActiveOrganizationSchema>,
  { organizationId: string }
>(
  setActiveOrganizationSchema,
  async ({ organizationId }, { logger }) => {
    // Active organization is a member/session preference and must stay out of shared organization rows.
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
