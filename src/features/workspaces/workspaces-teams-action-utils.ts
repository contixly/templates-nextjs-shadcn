import { HttpCodes } from "@typings/network";
import type { ActionResultError } from "@typings/actions";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }

  return "";
};

export const isUniqueConstraintError = (error: unknown) => {
  const message = extractErrorMessage(error);

  return message.includes("Unique constraint failed") || message.includes("duplicate key");
};

export const resolveWorkspaceTeamMutationError = (error: unknown): ActionResultError | null => {
  const message = extractErrorMessage(error);

  if (!message) {
    return null;
  }

  if (isUniqueConstraintError(error) || message.includes("already exists")) {
    return {
      message: WORKSPACE_ERROR_KEYS.teamDuplicateName,
      code: HttpCodes.CONFLICT,
    };
  }

  if (message.includes("Team not found")) {
    return {
      message: WORKSPACE_ERROR_KEYS.teamNotFound,
      code: HttpCodes.NOT_FOUND,
    };
  }

  if (message.includes("already a member") || message.includes("findOrCreateTeamMember")) {
    return {
      message: WORKSPACE_ERROR_KEYS.teamMemberAlreadyExists,
      code: HttpCodes.CONFLICT,
    };
  }

  if (message.includes("USER_IS_NOT_A_MEMBER") || message.includes("not a member")) {
    return {
      message: WORKSPACE_ERROR_KEYS.teamMemberCrossWorkspace,
      code: HttpCodes.BAD_REQUEST,
    };
  }

  if (message.includes("not allowed") || message.includes("NOT_ALLOWED")) {
    return {
      message: WORKSPACE_ERROR_KEYS.teamPermissionDenied,
      code: HttpCodes.FORBIDDEN,
    };
  }

  return null;
};
