export const WORKSPACE_ERROR_KEYS = {
  nameRequired: "validation.errors.nameRequired",
  nameTooLong: "validation.errors.nameTooLong",
  nameInvalidCharacters: "validation.errors.nameInvalidCharacters",
  nameUnchanged: "validation.errors.nameUnchanged",
  duplicateName: "validation.errors.duplicateName",
  duplicateSlug: "validation.errors.duplicateSlug",
  updatePermissionDenied: "validation.errors.updatePermissionDenied",
  confirmationRequired: "validation.errors.confirmationRequired",
  confirmationMismatch: "validation.errors.confirmationMismatch",
  atLeastOneWorkspace: "validation.errors.atLeastOneWorkspace",
  defaultWorkspaceDeletionForbidden: "validation.errors.defaultWorkspaceDeletionForbidden",
  deletePermissionDenied: "validation.errors.deletePermissionDenied",
  invitationEmailRequired: "validation.errors.invitationEmailRequired",
  invitationEmailInvalid: "validation.errors.invitationEmailInvalid",
  invitationAlreadyExists: "validation.errors.invitationAlreadyExists",
  invitationRecipientAlreadyMember: "validation.errors.invitationRecipientAlreadyMember",
  invitationPermissionDenied: "validation.errors.invitationPermissionDenied",
  invitationNotFound: "validation.errors.invitationNotFound",
  invitationNotPending: "validation.errors.invitationNotPending",
  invitationExpired: "validation.errors.invitationExpired",
  invitationRecipientMismatch: "validation.errors.invitationRecipientMismatch",
  invitationEmailVerificationRequired: "validation.errors.invitationEmailVerificationRequired",
  invitationAlreadyMember: "validation.errors.invitationAlreadyMember",
  memberIdRequired: "validation.errors.memberIdRequired",
  memberNotFound: "validation.errors.memberNotFound",
  memberAlreadyExists: "validation.errors.memberAlreadyExists",
  memberPermissionDenied: "validation.errors.memberPermissionDenied",
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
