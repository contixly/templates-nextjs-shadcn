"use server";

import { createProtectedActionWithInput } from "@lib/actions";
import { DeleteAccountInput, deleteAccountSchema } from "@features/accounts/accounts-schemas";
import { unauthorized } from "next/navigation";
import { HttpCodes } from "@typings/network";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import { accountsLogger } from "@features/accounts/accounts-logger";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { ACCOUNT_ERROR_KEYS } from "@features/accounts/accounts-errors";

/**
 * Represents an action to delete the account of the currently authenticated user.
 *
 * This protected action requires the user to confirm their email address before
 * account deletion is processed. The email provided must match the email associated
 * with the user's account. If the email fails to match, an error response is returned.
 *
 * Once the confirmation is successful, the user's account is deleted, and
 * the user is signed out. Logging is performed to record the account deletion
 * event.
 *
 * Input:
 * - `DeleteAccountInput`: The input must include the confirmation email address `confirmEmail`.
 *
 * Output:
 * - `void`: No value is returned, but a success response may be logged or passed internally.
 *
 * Error Codes:
 * - `HttpCodes.BAD_REQUEST`: Returned if the confirmation email does not match the user's account email.
 *
 * Logging:
 * - Logs a warning message to indicate the successful deletion of an account.
 *
 * Configuration:
 * - `actionName: "deleteAccount"`
 * - Logger: Uses `accountsLogger` for logging activities related to this action.
 */
export const deleteAccount = createProtectedActionWithInput<DeleteAccountInput, void>(
  deleteAccountSchema,
  async ({ confirmEmail }, { logger }) => {
    const user = await loadCurrentUser();

    if (!user) {
      unauthorized();
    }

    if (confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return {
        success: false,
        error: {
          message: ACCOUNT_ERROR_KEYS.confirmationEmailMismatch,
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    await auth.api.deleteUser({
      body: {},
      headers: await headers(),
    });

    await auth.api.signOut({
      headers: await headers(),
    });

    logger.warn("Account deletion successful");
    return { success: true };
  },
  { actionName: "deleteAccount", logger: accountsLogger }
);
