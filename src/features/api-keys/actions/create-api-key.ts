"use server";

import { unauthorized } from "next/navigation";
import { z } from "zod";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyDisplayData,
  type CreateApiKeyActionResult,
} from "@features/api-keys/api-keys-types";
import {
  expandApiKeyPresetIds,
  isApiKeyPermissionPresetId,
  type ApiKeyPermissionPresetId,
} from "@features/api-keys/api-keys-permissions";
import { auth } from "@server/auth";
import { HttpCodes } from "@typings/network";

const CREATE_API_KEY_FAILED_MESSAGE = "api_keys.create_failed";

const createApiKeyInputSchema = z.object({
  type: z.enum(["user", "organization"], {
    error: "api_keys.invalid_type",
  }),
  organizationId: z
    .string({ error: "api_keys.organization_id_required" })
    .trim()
    .min(1, { message: "api_keys.organization_id_required" })
    .optional(),
  name: z
    .string({ error: "api_keys.name_required" })
    .trim()
    .min(1, { message: "api_keys.name_required" })
    .max(32, { message: "api_keys.name_too_long" }),
  presetIds: z
    .array(z.string({ error: "api_keys.invalid_preset" }), {
      error: "api_keys.preset_required",
    })
    .min(1, { message: "api_keys.preset_required" })
    .refine((presetIds) => presetIds.every(isApiKeyPermissionPresetId), {
      message: "api_keys.invalid_preset",
    }),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;

const createdApiKeySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  start: z.string().nullable().optional(),
  configId: z.enum([API_KEY_USER_CONFIG_ID, API_KEY_ORGANIZATION_CONFIG_ID]),
  referenceId: z.string().min(1),
});

const createApiKeyFailure = (): CreateApiKeyActionResult => ({
  success: false,
  error: {
    code: HttpCodes.SERVER_ERROR,
    message: CREATE_API_KEY_FAILED_MESSAGE,
  },
});

const toApiKeyDisplayData = (value: unknown): ApiKeyDisplayData | null => {
  const parsed = createdApiKeySchema.safeParse(value);

  if (!parsed.success) {
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
  const parsed = createApiKeyInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: HttpCodes.BAD_REQUEST,
        message: parsed.error.issues[0]?.message ?? "api_keys.invalid_request",
      },
    };
  }

  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const presetIds = parsed.data.presetIds as ApiKeyPermissionPresetId[];
  const permissions = expandApiKeyPresetIds(presetIds);
  const logger = apiKeysLogger.child({
    function: "createApiKeyForCurrentUser",
    userId,
  });

  if (parsed.data.type === "organization" && !parsed.data.organizationId) {
    return {
      success: false,
      error: {
        code: HttpCodes.BAD_REQUEST,
        message: "api_keys.organization_id_required",
      },
    };
  }

  try {
    const created = await auth.api.createApiKey({
      body: {
        configId:
          parsed.data.type === "organization"
            ? API_KEY_ORGANIZATION_CONFIG_ID
            : API_KEY_USER_CONFIG_ID,
        ...(parsed.data.type === "organization"
          ? { organizationId: parsed.data.organizationId }
          : {}),
        name: parsed.data.name,
        userId,
        permissions,
      },
    });

    const data = toApiKeyDisplayData(created);
    if (!data) {
      logger.error({ error: "api_keys.created_key_payload_invalid" });
      return createApiKeyFailure();
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) });
    return createApiKeyFailure();
  }
};
