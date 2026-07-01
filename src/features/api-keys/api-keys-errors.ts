import { HttpCodes } from "@typings/network";

export const API_KEY_ERROR_KEYS = {
  invalidRequest: "api_keys.invalid_request",
  invalidType: "api_keys.invalid_type",
  nameRequired: "api_keys.name_required",
  nameTooLong: "api_keys.name_too_long",
  organizationIdRequired: "api_keys.organization_id_required",
  presetRequired: "api_keys.preset_required",
  invalidPreset: "api_keys.invalid_preset",
  rateLimitMaxInvalid: "api_keys.rate_limit_max_invalid",
  rateLimitWindowInvalid: "api_keys.rate_limit_window_invalid",
  expirationInvalid: "api_keys.expiration_invalid",
  keyNotFound: "api_keys.key_not_found",
  createFailed: "api_keys.create_failed",
  updateFailed: "api_keys.update_failed",
  deleteFailed: "api_keys.delete_failed",
  permissionDenied: "api_keys.permission_denied",
  noUpdateValues: "api_keys.no_update_values",
} as const;

export type ApiKeyErrorCode =
  | "api_key_missing"
  | "api_key_invalid"
  | "api_key_rate_limited"
  | "api_key_permission_denied"
  | "organization_access_denied"
  | "resource_not_found"
  | "invalid_request"
  | "internal_error";

export class ApiKeyHttpError extends Error {
  readonly status: number;
  readonly code: ApiKeyErrorCode;

  constructor(status: number, code: ApiKeyErrorCode, message: string) {
    super(message);
    this.name = "ApiKeyHttpError";
    this.status = status;
    this.code = code;
  }
}

export const apiDataResponse = <T>(data: T, init?: ResponseInit) => Response.json({ data }, init);

export const apiErrorResponse = (error: ApiKeyHttpError) =>
  Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status }
  );

export const apiKeyErrors = {
  missing: () => new ApiKeyHttpError(HttpCodes.UNAUTHORIZED, "api_key_missing", "API key required"),
  invalid: () => new ApiKeyHttpError(HttpCodes.UNAUTHORIZED, "api_key_invalid", "Invalid API key"),
  rateLimited: () =>
    new ApiKeyHttpError(
      HttpCodes.TOO_MANY_REQUESTS,
      "api_key_rate_limited",
      "API key rate limited"
    ),
  permissionDenied: () =>
    new ApiKeyHttpError(
      HttpCodes.FORBIDDEN,
      "api_key_permission_denied",
      "API key permission denied"
    ),
  organizationAccessDenied: () =>
    new ApiKeyHttpError(
      HttpCodes.FORBIDDEN,
      "organization_access_denied",
      "Organization access denied"
    ),
  notFound: () =>
    new ApiKeyHttpError(HttpCodes.NOT_FOUND, "resource_not_found", "Resource not found"),
  invalidRequest: () =>
    new ApiKeyHttpError(HttpCodes.BAD_REQUEST, "invalid_request", "Invalid request"),
  internal: () =>
    new ApiKeyHttpError(HttpCodes.SERVER_ERROR, "internal_error", "Internal server error"),
};

export const withApiKeyRouteErrors = async (handler: () => Promise<Response>) => {
  try {
    return await handler();
  } catch (error) {
    const { unstable_rethrow } = await import("next/navigation");

    unstable_rethrow(error);

    if (error instanceof ApiKeyHttpError) {
      return apiErrorResponse(error);
    }

    const { apiKeysLogger } = await import("@features/api-keys/api-keys-logger");

    apiKeysLogger
      .child({ type: "route" })
      .error({ error: error instanceof Error ? error.message : String(error) });

    return apiErrorResponse(apiKeyErrors.internal());
  }
};
