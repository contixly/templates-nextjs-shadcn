"use server";

import { createProtectedActionWithInput } from "@lib/actions";
import { UpdateProfileInput, updateProfileSchema } from "@features/accounts/accounts-schemas";
import { User } from "better-auth";
import { auth } from "@server/auth";
import { headers } from "next/headers";
import prisma from "@server/prisma";
import { errors } from "@components/errors/common-error";
import { accountsLogger } from "@features/accounts/accounts-logger";
import { ACCOUNT_ERROR_KEYS } from "@features/accounts/accounts-errors";

/**
 * Represents an action to update a user's profile details.
 *
 * This function is designed as a protected action that validates the input data against a schema.
 * It updates the user information and ensures database consistency. If the user does not exist,
 * an appropriate error is returned.
 *
 * Input:
 * - Expects input conforming to `UpdateProfileInput` including user profile details that need to be updated.
 *
 * Returned Value:
 * - Returns a `User` object containing the updated user profile information on success.
 *
 * Behavior:
 * - Validates the input data using `updateProfileSchema`.
 * - Updates the user's profile name using the authentication API.
 * - Retrieves the updated user from the database to ensure the changes are reflected.
 * - Returns an error if the specified user does not exist in the database.
 *
 * Error Handling:
 * - Returns validation error messages if the input data is invalid.
 * - Returns a `notFound` error if the user does not exist in the database.
 *
 * Options:
 * - The `actionName` is set to "updateProfile".
 * - Provides a custom error message for validation errors: "Profile name is required".
 * - Includes logging functionality for tracking updates.
 *
 * Dependencies:
 * - Depends on `auth.api.updateUser` for updating user data at the authentication layer.
 * - Uses `prisma.user.findUnique` to query the user from the database.
 */
export const updateProfile = createProtectedActionWithInput<UpdateProfileInput, User>(
  updateProfileSchema,
  async (input, { userId }) => {
    const { name } = input;

    await auth.api.updateUser({
      body: { name },
      headers: await headers(),
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errors.notFound;
    }

    return {
      success: true,
      data: user,
    };
  },
  {
    actionName: "updateProfile",
    validationErrorMessage: ACCOUNT_ERROR_KEYS.profileNameRequired,
    logger: accountsLogger,
  }
);
