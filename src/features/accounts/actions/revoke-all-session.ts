"use server";

import { createProtectedAction } from "@lib/actions";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import routes from "@features/routes";
import { accountsLogger } from "@features/accounts/accounts-logger";
import { loadCurrentSession, loadCurrentUserSessions } from "@features/accounts/accounts-actions";

/**
 * A protected action that revokes all active sessions of the current user except the current session.
 *
 * This operation retrieves the list of sessions associated with the current user and excludes
 * the current session from the revocation process. It then attempts to revoke all remaining
 * sessions by calling an authentication API.
 *
 * After successfully completing the revocation process, the method invalidates the cache
 * or revalidates the security-related paths to reflect the updated session state.
 *
 */
export const revokeAllSession = createProtectedAction<void>(
  async () => {
    const sessions = await loadCurrentUserSessions();
    const currentSession = await loadCurrentSession();

    if (!sessions || !currentSession) {
      return {
        success: false,
      };
    }

    await Promise.all(
      sessions
        .filter((session) => session.id !== currentSession.id)
        .map(async (session) =>
          auth.api.revokeSession({ body: { token: session.token }, headers: await headers() })
        )
    );

    revalidatePath(routes.accounts.pages.security.path());

    return {
      success: true,
    };
  },
  { actionName: "revokeAllSession", logger: accountsLogger }
);
