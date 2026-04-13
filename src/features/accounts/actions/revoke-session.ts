"use server";

import { createProtectedActionWithInput } from "@lib/actions";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import routes from "@features/routes";
import { accountsLogger } from "@features/accounts/accounts-logger";
import { id } from "@lib/z";

/**
 * A protected action to revoke a user session based on the provided session token.
 *
 * This action accepts a session token as input and invokes the authentication API
 * to revoke the corresponding session. Upon successful completion, it triggers
 * the revalidation of the security-related route to ensure an updated session state.
 *
 * The `revokeSession` action is designed to support secure handling of session
 * invalidation events, ensuring proper logging and error handling throughout
 * the process.
 *
 */
export const revokeSession = createProtectedActionWithInput<string, void>(
  id,
  async (token) => {
    await auth.api.revokeSession({
      body: { token },
      headers: await headers(),
    });

    revalidatePath(routes.accounts.pages.security.path());

    return {
      success: true,
    };
  },
  { actionName: "revokeSession", logger: accountsLogger }
);
