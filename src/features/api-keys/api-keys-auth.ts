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

const isPermissionCode = (code: string | undefined) =>
  code === "KEY_NOT_FOUND" || code === "INSUFFICIENT_API_KEY_PERMISSIONS";

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
    const result = (await auth.api.verifyApiKey({
      body: {
        configId,
        key,
        permissions,
      },
    })) as VerifyApiKeyResponse;

    if (result.valid && result.key) {
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
