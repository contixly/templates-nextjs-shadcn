"use server";

import { unauthorized } from "next/navigation";
import { z } from "zod";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
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

const createApiKeyInputSchema = z.object({
  type: z.enum(["user", "organization"]),
  organizationId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(32),
  presetIds: z
    .array(z.string())
    .min(1)
    .refine((presetIds) => presetIds.every(isApiKeyPermissionPresetId), {
      message: "api_keys.invalid_preset",
    }),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;

const toApiKeyDisplayData = (value: unknown): ApiKeyDisplayData => {
  const key = value as ApiKeyDisplayData;

  return {
    id: key.id,
    key: key.key,
    start: key.start ?? null,
    configId: key.configId,
    referenceId: key.referenceId,
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

  if (parsed.data.type === "organization" && !parsed.data.organizationId) {
    return {
      success: false,
      error: {
        code: HttpCodes.BAD_REQUEST,
        message: "api_keys.organization_id_required",
      },
    };
  }

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

  return {
    success: true,
    data: toApiKeyDisplayData(created),
  };
};
