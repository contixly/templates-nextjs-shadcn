"use server";

import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import routes from "@features/routes";
import { accountsLogger } from "@features/accounts/accounts-logger";
import { id } from "@lib/z";
import prisma from "@server/prisma";
import { HttpCodes } from "@typings/network";
import { loadCurrentSession } from "@features/accounts/accounts-actions";

/**
 * Revokes a user session by its opaque database id.
 *
 * The client never receives Better Auth session tokens. The action resolves the
 * token server-side after verifying ownership by current user id.
 */
export const revokeSession = createProtectedActionWithInput<string, void>(
  id,
  async (sessionId, { userId }) => {
    const currentSession = await loadCurrentSession();

    if (currentSession?.id === sessionId) {
      return {
        success: false,
        error: {
          message: "Cannot revoke the current session from this action.",
          code: HttpCodes.CONFLICT,
        },
      };
    }

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        token: true,
      },
    });

    if (!session) {
      return {
        success: false,
        error: {
          message: "Session not found.",
          code: HttpCodes.NOT_FOUND,
        },
      };
    }

    await auth.api.revokeSession({
      body: { token: session.token },
      headers: await headers(),
    });

    revalidatePath(routes.accounts.pages.security.path());

    return {
      success: true,
    };
  },
  { actionName: "revokeSession", logger: accountsLogger }
);
