import { z } from "zod";
import { ACCOUNT_ERROR_KEYS } from "@features/accounts/accounts-errors";
import { AnyTranslationsFn } from "@/src/i18n/config";

const MAX_PROFILE_NAME_LENGTH = 50;

const getErrorMessage = (
  tAny: AnyTranslationsFn | undefined,
  key: (typeof ACCOUNT_ERROR_KEYS)[keyof typeof ACCOUNT_ERROR_KEYS],
  options?: object
) => (tAny ? tAny(key, options) : key);

const createProfileNameSchema = (previousName?: string, tAny?: AnyTranslationsFn) =>
  z
    .string({ message: getErrorMessage(tAny, ACCOUNT_ERROR_KEYS.profileNameMustBeString) })
    .superRefine((value, ctx) => {
      const trimmedValue = value.trim();

      if (trimmedValue.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, ACCOUNT_ERROR_KEYS.profileNameTooShort, { min: 2 }),
        });
      }

      if (trimmedValue.length > MAX_PROFILE_NAME_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, ACCOUNT_ERROR_KEYS.profileNameTooLong, {
            max: MAX_PROFILE_NAME_LENGTH,
          }),
        });
      }

      if (
        previousName !== undefined &&
        value !== previousName &&
        trimmedValue === previousName.trim()
      ) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, ACCOUNT_ERROR_KEYS.profileNameUnchanged),
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

export const createUpdateProfileFormSchema = (previousName: string, tAny: AnyTranslationsFn) =>
  z.object({
    name: createProfileNameSchema(previousName, tAny),
  });

const createConfirmEmailBaseSchema = (tAny?: AnyTranslationsFn) =>
  z.email(getErrorMessage(tAny, ACCOUNT_ERROR_KEYS.confirmationEmailInvalid)).trim();

/**
 * Schema for deleting the user account
 */
export const deleteAccountSchema = z.object({
  confirmEmail: createConfirmEmailBaseSchema(),
});

const createConfirmEmailSchema = (email: string, tAny?: AnyTranslationsFn) =>
  createConfirmEmailBaseSchema(tAny).refine(
    (value) => value.trim().toLowerCase() === email.trim().toLowerCase(),
    {
      message: getErrorMessage(tAny, ACCOUNT_ERROR_KEYS.confirmationEmailMismatch),
    }
  );

export const createDeleteAccountFormSchema = (email: string, tAny: AnyTranslationsFn) =>
  z.object({
    confirmEmail: createConfirmEmailSchema(email, tAny),
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
