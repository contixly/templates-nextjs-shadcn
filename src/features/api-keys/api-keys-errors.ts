import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import { HttpCodes } from "@typings/network";

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
    if (error instanceof ApiKeyHttpError) {
      return apiErrorResponse(error);
    }

    apiKeysLogger
      .child({ type: "route" })
      .error({ error: error instanceof Error ? error.message : String(error) });

    return apiErrorResponse(apiKeyErrors.internal());
  }
};
