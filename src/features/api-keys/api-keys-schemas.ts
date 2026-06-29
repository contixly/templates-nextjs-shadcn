import { z } from "zod";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import {
  isApiKeyPermissionPresetId,
  type ApiKeyPermissionPresetId,
} from "@features/api-keys/api-keys-permissions";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";
import { id } from "@lib/z";

export const API_KEY_NAME_MAX_LENGTH = 32;
export const API_KEY_RATE_LIMIT_MAX_MAX = 1_000_000;

export const API_KEY_EXPIRATION_OPTIONS = ["never", "7d", "30d", "90d", "365d"] as const;
export const API_KEY_RATE_LIMIT_WINDOW_OPTIONS = ["1m", "1h", "1d"] as const;

export type ApiKeyExpirationOption = (typeof API_KEY_EXPIRATION_OPTIONS)[number];
export type ApiKeyRateLimitWindowOption = (typeof API_KEY_RATE_LIMIT_WINDOW_OPTIONS)[number];

const apiKeyIdSchema = id.or(z.string().regex(/^[A-Za-z0-9_-]+$/));
const apiKeyOrganizationIdSchema = organizationIdSchema.or(z.string().regex(/^[A-Za-z0-9_-]+$/));

const apiKeyOwnerTypeSchema = z.enum(["user", "organization"], {
  error: API_KEY_ERROR_KEYS.invalidType,
});

const apiKeyNameSchema = z
  .string({ error: API_KEY_ERROR_KEYS.nameRequired })
  .trim()
  .min(1, { message: API_KEY_ERROR_KEYS.nameRequired })
  .max(API_KEY_NAME_MAX_LENGTH, { message: API_KEY_ERROR_KEYS.nameTooLong });

const apiKeyPermissionPresetIdSchema = z
  .string({ error: API_KEY_ERROR_KEYS.invalidPreset })
  .refine(isApiKeyPermissionPresetId, {
    message: API_KEY_ERROR_KEYS.invalidPreset,
  }) as z.ZodType<ApiKeyPermissionPresetId>;

const apiKeyPresetIdsSchema = z
  .array(apiKeyPermissionPresetIdSchema, {
    error: API_KEY_ERROR_KEYS.presetRequired,
  })
  .min(1, { message: API_KEY_ERROR_KEYS.presetRequired });

const apiKeyRateLimitMaxSchema = z
  .number({ error: API_KEY_ERROR_KEYS.rateLimitMaxInvalid })
  .int({ message: API_KEY_ERROR_KEYS.rateLimitMaxInvalid })
  .min(1, { message: API_KEY_ERROR_KEYS.rateLimitMaxInvalid })
  .max(API_KEY_RATE_LIMIT_MAX_MAX, { message: API_KEY_ERROR_KEYS.rateLimitMaxInvalid });

const apiKeyExpirationOptionSchema = z.enum(API_KEY_EXPIRATION_OPTIONS, {
  error: API_KEY_ERROR_KEYS.expirationInvalid,
});

const apiKeyRateLimitWindowSchema = z.enum(API_KEY_RATE_LIMIT_WINDOW_OPTIONS, {
  error: API_KEY_ERROR_KEYS.rateLimitWindowInvalid,
});

export const mapApiKeyExpirationOptionToSeconds = (option: ApiKeyExpirationOption) => {
  switch (option) {
    case "never":
      return null;
    case "7d":
      return 7 * 24 * 60 * 60;
    case "30d":
      return 30 * 24 * 60 * 60;
    case "90d":
      return 90 * 24 * 60 * 60;
    case "365d":
      return 365 * 24 * 60 * 60;
  }
};

export const mapApiKeyRateLimitWindowToMs = (option: ApiKeyRateLimitWindowOption) => {
  switch (option) {
    case "1m":
      return 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "1d":
      return 24 * 60 * 60 * 1000;
  }
};

const requireOrganizationId = (
  value: { type: "user" | "organization"; organizationId?: string },
  ctx: z.RefinementCtx
) => {
  if (value.type === "organization" && !value.organizationId) {
    ctx.addIssue({
      code: "custom",
      message: API_KEY_ERROR_KEYS.organizationIdRequired,
      path: ["organizationId"],
    });
  }
};

export const apiKeyCreateFormSchema = z
  .object({
    type: apiKeyOwnerTypeSchema,
    organizationId: apiKeyOrganizationIdSchema.optional(),
    name: apiKeyNameSchema,
    presetIds: apiKeyPresetIdsSchema,
    expiresIn: apiKeyExpirationOptionSchema,
    rateLimitEnabled: z.boolean({ error: API_KEY_ERROR_KEYS.invalidRequest }),
    rateLimitMax: apiKeyRateLimitMaxSchema,
    rateLimitWindow: apiKeyRateLimitWindowSchema,
  })
  .superRefine(requireOrganizationId);

export type ApiKeyCreateFormInput = z.infer<typeof apiKeyCreateFormSchema>;
export type ApiKeyCreateInput = ApiKeyCreateFormInput;

export const apiKeyUpdateFormSchema = z
  .object({
    type: apiKeyOwnerTypeSchema,
    keyId: apiKeyIdSchema,
    organizationId: apiKeyOrganizationIdSchema.optional(),
    name: apiKeyNameSchema.optional(),
    presetIds: apiKeyPresetIdsSchema.optional(),
    expiresIn: apiKeyExpirationOptionSchema.optional(),
    rateLimitEnabled: z.boolean({ error: API_KEY_ERROR_KEYS.invalidRequest }).optional(),
    rateLimitMax: apiKeyRateLimitMaxSchema.optional(),
    rateLimitWindow: apiKeyRateLimitWindowSchema.optional(),
    enabled: z.boolean({ error: API_KEY_ERROR_KEYS.invalidRequest }).optional(),
  })
  .superRefine((value, ctx) => {
    requireOrganizationId(value, ctx);

    const hasUpdateValue =
      value.name !== undefined ||
      value.presetIds !== undefined ||
      value.expiresIn !== undefined ||
      value.rateLimitEnabled !== undefined ||
      value.rateLimitMax !== undefined ||
      value.rateLimitWindow !== undefined ||
      value.enabled !== undefined;

    if (!hasUpdateValue) {
      ctx.addIssue({
        code: "custom",
        message: API_KEY_ERROR_KEYS.noUpdateValues,
      });
    }
  });

export type ApiKeyUpdateFormInput = z.infer<typeof apiKeyUpdateFormSchema>;
export type ApiKeyUpdateInput = ApiKeyUpdateFormInput;

export const apiKeyDeleteSchema = z
  .object({
    type: apiKeyOwnerTypeSchema,
    keyId: apiKeyIdSchema,
    organizationId: apiKeyOrganizationIdSchema.optional(),
  })
  .superRefine(requireOrganizationId);

export type ApiKeyDeleteInput = z.infer<typeof apiKeyDeleteSchema>;
