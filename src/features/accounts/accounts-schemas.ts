import { z } from "zod";

const MAX_PROFILE_NAME_LENGTH = 50;

const createProfileNameSchema = (previousName?: string) =>
  z
    .string({ message: "Name must be a string" })
    .superRefine((value, ctx) => {
      const trimmedValue = value.trim();

      if (trimmedValue.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Name must be at least 2 characters",
        });
      }

      if (trimmedValue.length > MAX_PROFILE_NAME_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Name must be at most ${MAX_PROFILE_NAME_LENGTH} characters`,
        });
      }

      if (
        previousName !== undefined &&
        value !== previousName &&
        trimmedValue === previousName.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "New profile name must be different from current name",
        });
      }
    })
    .transform((value) => value.trim());

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  name: createProfileNameSchema(),
});

export const createUpdateProfileFormSchema = (previousName: string) =>
  z.object({
    name: createProfileNameSchema(previousName),
  });

const confirmEmail = z.email("Invalid email format").trim();

/**
 * Schema for deleting the user account
 */
export const deleteAccountSchema = z.object({
  confirmEmail,
});

const createConfirmEmailSchema = (email: string) =>
  confirmEmail.refine((value) => value.trim().toLowerCase() === email.trim().toLowerCase(), {
    message: "Email must match account email",
  });

export const createDeleteAccountFormSchema = (email: string) =>
  z.object({
    confirmEmail: createConfirmEmailSchema(email),
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
