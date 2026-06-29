"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";
import { z } from "zod";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
  type ApiKeyDisplayData,
  type CreateApiKeyActionResult,
} from "@features/api-keys/api-keys-types";
import { expandApiKeyPresetIds } from "@features/api-keys/api-keys-permissions";
import {
  apiKeyCreateFormSchema,
  mapApiKeyExpirationOptionToSeconds,
  mapApiKeyRateLimitWindowToMs,
} from "@features/api-keys/api-keys-schemas";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { auth } from "@server/auth";
import { HttpCodes } from "@typings/network";

export type CreateApiKeyInput = z.output<typeof apiKeyCreateFormSchema>;

const createdApiKeySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  start: z.string().nullable().optional(),
  configId: z.enum([API_KEY_USER_CONFIG_ID, API_KEY_ORGANIZATION_CONFIG_ID]),
  referenceId: z.string().min(1),
});

const getValidationMessage = (message: string | undefined) =>
  message?.startsWith("api_keys.") ? message : API_KEY_ERROR_KEYS.invalidRequest;

const createApiKeyFailure = (): CreateApiKeyActionResult => ({
  success: false,
  error: {
    code: HttpCodes.SERVER_ERROR,
    message: API_KEY_ERROR_KEYS.createFailed,
  },
});

const getRevalidationPath = (input: CreateApiKeyInput) =>
  input.type === "organization"
    ? `/w/${input.organizationKey ?? input.organizationId}/settings/api-keys`
    : "/user/api-keys";

const toApiKeyDisplayData = (
  value: unknown,
  expected: {
    configId: ApiKeyConfigId;
    referenceId: string;
  }
): ApiKeyDisplayData | null => {
  const parsed = createdApiKeySchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  if (
    parsed.data.configId !== expected.configId ||
    parsed.data.referenceId !== expected.referenceId
  ) {
    return null;
  }

  return {
    id: parsed.data.id,
    key: parsed.data.key,
    start: parsed.data.start ?? null,
    configId: parsed.data.configId,
    referenceId: parsed.data.referenceId,
  };
};

export const createApiKeyForCurrentUser = async (
  input: CreateApiKeyInput
): Promise<CreateApiKeyActionResult> => {
  const parsed = apiKeyCreateFormSchema.safeParse(input);
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
    const canCreateOrganizationKey = await hasWorkspacePermission(parsed.data.organizationId, {
      apiKey: ["create"],
    });

    if (!canCreateOrganizationKey) {
      return {
        success: false,
        error: {
          code: HttpCodes.FORBIDDEN,
          message: API_KEY_ERROR_KEYS.permissionDenied,
        },
      };
    }
  }

  const permissions = expandApiKeyPresetIds(parsed.data.presetIds);
  const configId =
    parsed.data.type === "organization" ? API_KEY_ORGANIZATION_CONFIG_ID : API_KEY_USER_CONFIG_ID;
  const referenceId = parsed.data.type === "organization" ? parsed.data.organizationId : userId;
  const logger = apiKeysLogger.child({
    function: "createApiKeyForCurrentUser",
    userId,
  });

  try {
    const created = await auth.api.createApiKey({
      body: {
        configId,
        ...(parsed.data.type === "organization" ? { organizationId: referenceId } : {}),
        name: parsed.data.name,
        userId,
        permissions,
        expiresIn: mapApiKeyExpirationOptionToSeconds(parsed.data.expiresIn),
        rateLimitEnabled: parsed.data.rateLimitEnabled,
        rateLimitMax: parsed.data.rateLimitMax,
        rateLimitTimeWindow: mapApiKeyRateLimitWindowToMs(parsed.data.rateLimitWindow),
      },
    });

    const data = toApiKeyDisplayData(created, {
      configId,
      referenceId,
    });
    if (!data) {
      logger.error({ error: "api_keys.created_key_payload_invalid" });
      return createApiKeyFailure();
    }

    revalidatePath(getRevalidationPath(parsed.data));

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) });
    return createApiKeyFailure();
  }
};
