import { HttpCodes } from "@typings/network";
import type { ActionResultError } from "@typings/actions";
import { type WorkspaceInvitationDecisionState } from "@features/workspaces/workspaces-invitations-types";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";

export const getWorkspaceInvitationDecisionError = (
  state: WorkspaceInvitationDecisionState
): ActionResultError => {
  switch (state) {
    case "expired":
      return {
        message: WORKSPACE_ERROR_KEYS.invitationExpired,
        code: HttpCodes.CONFLICT,
      };
    case "recipient-mismatch":
      return {
        message: WORKSPACE_ERROR_KEYS.invitationRecipientMismatch,
        code: HttpCodes.FORBIDDEN,
      };
    case "email-verification-required":
      return {
        message: WORKSPACE_ERROR_KEYS.invitationEmailVerificationRequired,
        code: HttpCodes.FORBIDDEN,
      };
    case "already-member":
      return {
        message: WORKSPACE_ERROR_KEYS.invitationAlreadyMember,
        code: HttpCodes.CONFLICT,
      };
    case "accepted":
    case "rejected":
    case "canceled":
      return {
        message: WORKSPACE_ERROR_KEYS.invitationNotPending,
        code: HttpCodes.CONFLICT,
      };
    case "pending":
      return {
        message: WORKSPACE_ERROR_KEYS.invitationNotPending,
        code: HttpCodes.CONFLICT,
      };
  }
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }

  return "";
};

export const resolveWorkspaceInvitationMutationError = (
  error: unknown
): ActionResultError | null => {
  const message = extractErrorMessage(error);

  if (!message) {
    return null;
  }

  if (message.includes("User is already invited")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationAlreadyExists,
      code: HttpCodes.CONFLICT,
    };
  }

  if (message.includes("User is already a member")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationRecipientAlreadyMember,
      code: HttpCodes.CONFLICT,
    };
  }

  if (message.includes("You are not allowed to invite users")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationPermissionDenied,
      code: HttpCodes.FORBIDDEN,
    };
  }

  if (message.includes("Invitation not found")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationNotFound,
      code: HttpCodes.NOT_FOUND,
    };
  }

  if (message.includes("Email verification required")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationEmailVerificationRequired,
      code: HttpCodes.FORBIDDEN,
    };
  }

  if (message.includes("You are not the recipient")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationRecipientMismatch,
      code: HttpCodes.FORBIDDEN,
    };
  }

  if (message.includes("Unique constraint failed") || message.includes("duplicate key")) {
    return {
      message: WORKSPACE_ERROR_KEYS.invitationAlreadyExists,
      code: HttpCodes.CONFLICT,
    };
  }

  return null;
};
