export const WORKSPACE_ERROR_KEYS = {
  nameRequired: "validation.errors.nameRequired",
  nameTooLong: "validation.errors.nameTooLong",
  nameInvalidCharacters: "validation.errors.nameInvalidCharacters",
  nameUnchanged: "validation.errors.nameUnchanged",
  duplicateName: "validation.errors.duplicateName",
  confirmationRequired: "validation.errors.confirmationRequired",
  confirmationMismatch: "validation.errors.confirmationMismatch",
  atLeastOneWorkspace: "validation.errors.atLeastOneWorkspace",
  defaultWorkspaceDeletionForbidden: "validation.errors.defaultWorkspaceDeletionForbidden",
} as const;

const WORKSPACE_ERROR_KEY_SET = new Set<string>(Object.values(WORKSPACE_ERROR_KEYS));

export const translateWorkspaceErrorMessage = (
  message: string | undefined,
  tAny: (key: string, options?: object) => string
) => {
  if (!message) {
    return undefined;
  }

  return WORKSPACE_ERROR_KEY_SET.has(message) ? tAny(message) : message;
};
