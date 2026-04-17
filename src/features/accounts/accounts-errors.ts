export const ACCOUNT_ERROR_KEYS = {
  profileNameRequired: "validation.errors.profileNameRequired",
  profileNameMustBeString: "validation.errors.profileNameMustBeString",
  profileNameTooShort: "validation.errors.profileNameTooShort",
  profileNameTooLong: "validation.errors.profileNameTooLong",
  profileNameUnchanged: "validation.errors.profileNameUnchanged",
  confirmationEmailInvalid: "validation.errors.confirmationEmailInvalid",
  confirmationEmailMismatch: "validation.errors.confirmationEmailMismatch",
} as const;

const ACCOUNT_ERROR_KEY_SET = new Set<string>(Object.values(ACCOUNT_ERROR_KEYS));

export const translateAccountErrorMessage = (
  message: string | undefined,
  tAny: (key: string, options?: object) => string
) => {
  if (!message) {
    return undefined;
  }

  return ACCOUNT_ERROR_KEY_SET.has(message) ? tAny(message) : message;
};
