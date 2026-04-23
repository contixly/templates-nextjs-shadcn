import "server-only";

import { headers } from "next/headers";
import { auth } from "@server/auth";

export const hasWorkspacePermission = async (
  organizationId: string,
  permissions: Record<string, string[]>
) => {
  try {
    const result = (await auth.api.hasPermission({
      body: {
        organizationId,
        permissions,
      },
      headers: await headers(),
    })) as { success?: boolean } | undefined;

    return Boolean(result?.success);
  } catch {
    return false;
  }
};
