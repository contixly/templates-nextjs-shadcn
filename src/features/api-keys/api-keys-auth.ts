import "server-only";

import prisma from "@server/prisma";
import { auth } from "@server/auth";
import {
  API_KEY_HEADER_NAME,
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
  type ApiKeyPermissionRecord,
  type ApiKeyPrincipal,
} from "@features/api-keys/api-keys-types";
import { apiKeyErrors } from "@features/api-keys/api-keys-errors";

interface VerifyApiKeyResponse {
  valid: boolean;
  error?: {
    code?: string;
    message?: string;
  } | null;
  key?: {
    id: string;
    start?: string | null;
    configId: string;
    referenceId: string;
    permissions?: ApiKeyPermissionRecord | null;
  } | null;
}

const API_KEY_CONFIG_IDS = [
  API_KEY_USER_CONFIG_ID,
  API_KEY_ORGANIZATION_CONFIG_ID,
] satisfies ApiKeyConfigId[];

const getRequestApiKey = (request: Request) => {
  const value = request.headers.get(API_KEY_HEADER_NAME);
  return value?.trim() || null;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isValidVerifiedKey = (
  configId: ApiKeyConfigId,
  key: VerifyApiKeyResponse["key"]
): key is NonNullable<VerifyApiKeyResponse["key"]> =>
  key !== null &&
  key !== undefined &&
  isNonEmptyString(key?.id) &&
  isNonEmptyString(key.referenceId) &&
  key.configId === configId;

const toPrincipal = (
  configId: ApiKeyConfigId,
  key: NonNullable<VerifyApiKeyResponse["key"]>
): ApiKeyPrincipal => {
  if (configId === API_KEY_USER_CONFIG_ID) {
    return {
      type: "user",
      keyId: key.id,
      keyStart: key.start ?? null,
      configId,
      userId: key.referenceId,
      permissions: key.permissions ?? null,
    };
  }

  return {
    type: "organization",
    keyId: key.id,
    keyStart: key.start ?? null,
    configId,
    organizationId: key.referenceId,
    permissions: key.permissions ?? null,
  };
};

const isRateLimitCode = (code: string | undefined) =>
  code === "RATE_LIMITED" || code === "RATE_LIMIT_EXCEEDED" || code === "USAGE_EXCEEDED";

// Better Auth reports these codes when the verifier matched a key but rejected requested scopes.
const isPermissionCode = (code: string | undefined) =>
  code === "KEY_NOT_FOUND" || code === "INSUFFICIENT_API_KEY_PERMISSIONS";

const isInvalidKeyCode = (code: string | undefined) => code === "INVALID_API_KEY";

const getAuthErrorCode = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const code = "code" in error ? error.code : undefined;
  if (typeof code === "string") {
    return code;
  }

  const nestedError = "error" in error ? error.error : undefined;
  if (nestedError && typeof nestedError === "object" && "code" in nestedError) {
    const nestedCode = nestedError.code;
    return typeof nestedCode === "string" ? nestedCode : undefined;
  }

  return undefined;
};

export const requireApiKey = async (
  request: Request,
  permissions: ApiKeyPermissionRecord
): Promise<ApiKeyPrincipal> => {
  const key = getRequestApiKey(request);
  if (!key) {
    throw apiKeyErrors.missing();
  }

  let sawPermissionFailure = false;

  for (const configId of API_KEY_CONFIG_IDS) {
    let result: VerifyApiKeyResponse;

    try {
      result = (await auth.api.verifyApiKey({
        body: {
          configId,
          key,
          permissions,
        },
      })) as VerifyApiKeyResponse;
    } catch (error) {
      const code = getAuthErrorCode(error);
      if (isRateLimitCode(code)) {
        throw apiKeyErrors.rateLimited();
      }
      if (isPermissionCode(code)) {
        sawPermissionFailure = true;
        continue;
      }
      if (isInvalidKeyCode(code)) {
        continue;
      }

      throw error;
    }

    if (result.valid) {
      if (!isValidVerifiedKey(configId, result.key)) {
        throw apiKeyErrors.invalid();
      }

      return toPrincipal(configId, result.key);
    }

    const code = result.error?.code;
    if (isRateLimitCode(code)) {
      throw apiKeyErrors.rateLimited();
    }
    if (isPermissionCode(code)) {
      sawPermissionFailure = true;
    }
  }

  if (sawPermissionFailure) {
    throw apiKeyErrors.permissionDenied();
  }

  throw apiKeyErrors.invalid();
};

export const requireApiOrganizationAccess = async (
  principal: ApiKeyPrincipal,
  organizationId: string
) => {
  if (principal.type === "organization") {
    if (principal.organizationId !== organizationId) {
      throw apiKeyErrors.organizationAccessDenied();
    }

    return { organizationId };
  }

  const member = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: principal.userId,
    },
    select: {
      id: true,
    },
  });

  if (!member) {
    throw apiKeyErrors.organizationAccessDenied();
  }

  return { organizationId };
};
