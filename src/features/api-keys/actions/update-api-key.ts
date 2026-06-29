"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import { toApiKeyListItemDto } from "@features/api-keys/api-keys-management";
import { expandApiKeyPresetIds } from "@features/api-keys/api-keys-permissions";
import {
  apiKeyUpdateFormSchema,
  mapApiKeyExpirationOptionToSeconds,
  mapApiKeyRateLimitWindowToMs,
  type ApiKeyUpdateInput,
} from "@features/api-keys/api-keys-schemas";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyListItemDto,
} from "@features/api-keys/api-keys-types";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { auth } from "@server/auth";
import type { ActionResult } from "@typings/actions";
import { HttpCodes } from "@typings/network";

type UpdateApiKeyBody = {
  configId: typeof API_KEY_USER_CONFIG_ID | typeof API_KEY_ORGANIZATION_CONFIG_ID;
  keyId: string;
  userId: string;
  name?: string;
  enabled?: boolean;
  expiresIn?: number | null;
  rateLimitEnabled?: boolean;
  rateLimitMax?: number;
  rateLimitTimeWindow?: number;
  permissions?: Record<string, string[]>;
};

const getValidationMessage = (message: string | undefined) =>
  message?.startsWith("api_keys.") ? message : API_KEY_ERROR_KEYS.invalidRequest;

const updateFailure = (): ActionResult<ApiKeyListItemDto> => ({
  success: false,
  error: {
    code: HttpCodes.SERVER_ERROR,
    message: API_KEY_ERROR_KEYS.updateFailed,
  },
});

const getRevalidationPath = (input: ApiKeyUpdateInput) =>
  input.type === "organization"
    ? `/w/${input.organizationKey ?? input.organizationId}/settings/api-keys`
    : "/user/api-keys";

export const updateApiKeyForCurrentUser = async (
  input: ApiKeyUpdateInput
): Promise<ActionResult<ApiKeyListItemDto>> => {
  const parsed = apiKeyUpdateFormSchema.safeParse(input);
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
    const canUpdate = await hasWorkspacePermission(parsed.data.organizationId, {
      apiKey: ["update"],
    });

    if (!canUpdate) {
      return {
        success: false,
        error: {
          code: HttpCodes.FORBIDDEN,
          message: API_KEY_ERROR_KEYS.permissionDenied,
        },
      };
    }
  }

  const body: UpdateApiKeyBody = {
    configId:
      parsed.data.type === "organization" ? API_KEY_ORGANIZATION_CONFIG_ID : API_KEY_USER_CONFIG_ID,
    keyId: parsed.data.keyId,
    userId,
  };

  if (parsed.data.name !== undefined) {
    body.name = parsed.data.name;
  }
  if (parsed.data.enabled !== undefined) {
    body.enabled = parsed.data.enabled;
  }
  if (parsed.data.presetIds !== undefined) {
    body.permissions = expandApiKeyPresetIds(parsed.data.presetIds);
  }
  if (parsed.data.expiresIn !== undefined) {
    body.expiresIn = mapApiKeyExpirationOptionToSeconds(parsed.data.expiresIn);
  }
  if (parsed.data.rateLimitEnabled !== undefined) {
    body.rateLimitEnabled = parsed.data.rateLimitEnabled;
  }
  if (parsed.data.rateLimitMax !== undefined) {
    body.rateLimitMax = parsed.data.rateLimitMax;
  }
  if (parsed.data.rateLimitWindow !== undefined) {
    body.rateLimitTimeWindow = mapApiKeyRateLimitWindowToMs(parsed.data.rateLimitWindow);
  }

  const logger = apiKeysLogger.child({
    function: "updateApiKeyForCurrentUser",
    userId,
  });

  try {
    const updated = await auth.api.updateApiKey({ body });
    const data = toApiKeyListItemDto(updated as Parameters<typeof toApiKeyListItemDto>[0]);

    revalidatePath(getRevalidationPath(parsed.data));

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) });
    return updateFailure();
  }
};
