"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import { apiKeyDeleteSchema, type ApiKeyDeleteInput } from "@features/api-keys/api-keys-schemas";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
} from "@features/api-keys/api-keys-types";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { auth } from "@server/auth";
import type { ActionResult } from "@typings/actions";
import { HttpCodes } from "@typings/network";

const getValidationMessage = (message: string | undefined) =>
  message?.startsWith("api_keys.") ? message : API_KEY_ERROR_KEYS.invalidRequest;

const getRevalidationPath = (input: ApiKeyDeleteInput) =>
  input.type === "organization" ? `/w/${input.organizationId}/settings/api-keys` : "/user/api-keys";

export const deleteApiKeyForCurrentUser = async (
  input: ApiKeyDeleteInput
): Promise<ActionResult<void>> => {
  const parsed = apiKeyDeleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: HttpCodes.BAD_REQUEST,
        message: getValidationMessage(parsed.error.issues[0]?.message),
      },
    };
  }

  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  if (parsed.data.type === "organization") {
    const canDelete = await hasWorkspacePermission(parsed.data.organizationId, {
      apiKey: ["delete"],
    });

    if (!canDelete) {
      return {
        success: false,
        error: {
          code: HttpCodes.FORBIDDEN,
          message: API_KEY_ERROR_KEYS.permissionDenied,
        },
      };
    }
  }

  const logger = apiKeysLogger.child({
    function: "deleteApiKeyForCurrentUser",
    userId,
  });

  try {
    await auth.api.deleteApiKey({
      body: {
        configId:
          parsed.data.type === "organization"
            ? API_KEY_ORGANIZATION_CONFIG_ID
            : API_KEY_USER_CONFIG_ID,
        keyId: parsed.data.keyId,
      },
    });

    revalidatePath(getRevalidationPath(parsed.data));

    return { success: true };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) });

    return {
      success: false,
      error: {
        code: HttpCodes.SERVER_ERROR,
        message: API_KEY_ERROR_KEYS.deleteFailed,
      },
    };
  }
};
