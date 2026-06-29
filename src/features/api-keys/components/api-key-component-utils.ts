import {
  apiKeyPermissionPresetOptions,
  type ApiKeyPermissionPresetId,
} from "@features/api-keys/api-keys-permissions";
import type { ApiKeyPermissionRecord } from "@features/api-keys/api-keys-types";

type TranslationFn = (key: string) => string;

const API_KEY_ERROR_TRANSLATION_KEYS: Record<string, string> = {
  "api_keys.invalid_request": "errors.invalidRequest",
  "api_keys.invalid_type": "errors.invalidType",
  "api_keys.name_required": "errors.nameRequired",
  "api_keys.name_too_long": "errors.nameTooLong",
  "api_keys.organization_id_required": "errors.organizationIdRequired",
  "api_keys.preset_required": "errors.presetRequired",
  "api_keys.invalid_preset": "errors.invalidPreset",
  "api_keys.rate_limit_max_invalid": "errors.rateLimitMaxInvalid",
  "api_keys.rate_limit_window_invalid": "errors.rateLimitWindowInvalid",
  "api_keys.expiration_invalid": "errors.expirationInvalid",
  "api_keys.key_not_found": "errors.keyNotFound",
  "api_keys.create_failed": "errors.createFailed",
  "api_keys.update_failed": "errors.updateFailed",
  "api_keys.delete_failed": "errors.deleteFailed",
  "api_keys.permission_denied": "errors.permissionDenied",
  "api_keys.no_update_values": "errors.noUpdateValues",
};

export const translateApiKeyErrorMessage = (
  message: string | undefined,
  t: TranslationFn,
  fallbackKey = "form.unknownError"
) => {
  if (!message) {
    return t(fallbackKey);
  }

  const translationKey = API_KEY_ERROR_TRANSLATION_KEYS[message];
  return translationKey ? t(translationKey) : message;
};

export const translatedFieldError = (message: string | undefined, t: TranslationFn) =>
  message
    ? {
        message: translateApiKeyErrorMessage(message, t),
      }
    : undefined;

const recordContains = (
  permissions: ApiKeyPermissionRecord | null,
  expected: ApiKeyPermissionRecord
) =>
  Object.entries(expected).every(([resource, actions]) =>
    (actions ?? []).every((action) => permissions?.[resource]?.includes(action))
  );

const recordEquals = (
  permissions: ApiKeyPermissionRecord | null,
  expected: ApiKeyPermissionRecord
) => {
  const expectedEntries = Object.entries(expected);
  const permissionEntries = Object.entries(permissions ?? {}).filter(
    ([, actions]) => (actions ?? []).length > 0
  );

  return (
    expectedEntries.length === permissionEntries.length && recordContains(permissions, expected)
  );
};

export const getPresetIdsForPermissions = (
  permissions: ApiKeyPermissionRecord | null
): ApiKeyPermissionPresetId[] => {
  const exactMatches = apiKeyPermissionPresetOptions
    .filter((option) => recordEquals(permissions, option.permissions))
    .map((option) => option.value);

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return apiKeyPermissionPresetOptions
    .filter((option) => recordContains(permissions, option.permissions))
    .map((option) => option.value);
};
