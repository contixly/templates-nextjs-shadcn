import "server-only";

import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
  type ApiKeyListItemDto,
  type ApiKeyManagementCapabilities,
  type ApiKeyManagementPageData,
  type ApiKeyPermissionRecord,
  type ApiKeyStatus,
} from "@features/api-keys/api-keys-types";

interface ApiKeyListResponse {
  apiKeys: ApiKeyRecord[];
}

interface ApiKeyRecord {
  id: string;
  configId: string;
  name: string | null;
  start: string | null;
  prefix: string | null;
  key?: string;
  referenceId: string;
  refillInterval: number | null;
  refillAmount: number | null;
  lastRefillAt: Date | null;
  enabled: boolean;
  rateLimitEnabled: boolean;
  rateLimitTimeWindow: number | null;
  rateLimitMax: number | null;
  requestCount: number;
  remaining: number | null;
  lastRequest: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Record<string, string[]> | null;
  metadata: Record<string, unknown> | null;
}

const isApiKeyConfigId = (value: string): value is ApiKeyConfigId =>
  value === API_KEY_USER_CONFIG_ID || value === API_KEY_ORGANIZATION_CONFIG_ID;

export const getApiKeyStatus = ({
  enabled,
  expiresAt,
}: {
  enabled: boolean;
  expiresAt: Date | null;
}): ApiKeyStatus => {
  if (!enabled) {
    return "disabled";
  }

  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return "expired";
  }

  return "active";
};

export const toApiKeyListItemDto = (apiKey: ApiKeyRecord): ApiKeyListItemDto => {
  if (!isApiKeyConfigId(apiKey.configId)) {
    throw new Error(`Unsupported API key config id: ${apiKey.configId}`);
  }

  return {
    id: apiKey.id,
    configId: apiKey.configId,
    name: apiKey.name,
    start: apiKey.start,
    prefix: apiKey.prefix,
    referenceId: apiKey.referenceId,
    enabled: apiKey.enabled,
    status: getApiKeyStatus({
      enabled: apiKey.enabled,
      expiresAt: apiKey.expiresAt,
    }),
    permissions: (apiKey.permissions as ApiKeyPermissionRecord | null | undefined) ?? null,
    rateLimitEnabled: apiKey.rateLimitEnabled,
    rateLimitTimeWindow: apiKey.rateLimitTimeWindow,
    rateLimitMax: apiKey.rateLimitMax,
    requestCount: apiKey.requestCount,
    remaining: apiKey.remaining,
    lastRequest: apiKey.lastRequest,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
  };
};

const listApiKeys = async (query: Record<string, string>) => {
  const [{ loadRequestHeaders }, { auth }] = await Promise.all([
    import("@features/accounts/accounts-actions"),
    import("@server/auth"),
  ]);
  const response = (await auth.api.listApiKeys({
    headers: await loadRequestHeaders(),
    query,
  })) as ApiKeyListResponse;

  return response.apiKeys.map(toApiKeyListItemDto);
};

export const loadPersonalApiKeysPageData = async (): Promise<ApiKeyManagementPageData> => {
  const [{ unauthorized }, { loadCurrentUserId }] = await Promise.all([
    import("next/navigation"),
    import("@features/accounts/accounts-actions"),
  ]);
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const keys = await listApiKeys({
    configId: API_KEY_USER_CONFIG_ID,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  return {
    ownerType: "user",
    keys,
    capabilities: {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
  };
};

export const loadOrganizationApiKeyCapabilities = async (
  organizationId: string
): Promise<ApiKeyManagementCapabilities> => {
  const { hasWorkspacePermission } = await import("@features/workspaces/workspaces-permissions");
  const [canRead, canCreate, canUpdate, canDelete] = await Promise.all([
    hasWorkspacePermission(organizationId, { apiKey: ["read"] }),
    hasWorkspacePermission(organizationId, { apiKey: ["create"] }),
    hasWorkspacePermission(organizationId, { apiKey: ["update"] }),
    hasWorkspacePermission(organizationId, { apiKey: ["delete"] }),
  ]);

  return {
    canCreate: canRead && canCreate,
    canUpdate: canRead && canUpdate,
    canDelete: canRead && canDelete,
  };
};

export const loadOrganizationApiKeysPageData = async ({
  organizationId,
  organizationKey,
}: {
  organizationId: string;
  organizationKey: string;
}): Promise<ApiKeyManagementPageData> => {
  const [{ forbidden, unauthorized }, { loadCurrentUserId }, { hasWorkspacePermission }] =
    await Promise.all([
      import("next/navigation"),
      import("@features/accounts/accounts-actions"),
      import("@features/workspaces/workspaces-permissions"),
    ]);
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  const canRead = await hasWorkspacePermission(organizationId, { apiKey: ["read"] });
  if (!canRead) {
    forbidden();
  }

  const [keys, capabilities] = await Promise.all([
    listApiKeys({
      organizationId,
      configId: API_KEY_ORGANIZATION_CONFIG_ID,
      sortBy: "createdAt",
      sortDirection: "desc",
    }),
    loadOrganizationApiKeyCapabilities(organizationId),
  ]);

  return {
    ownerType: "organization",
    organizationId,
    organizationKey,
    keys,
    capabilities,
  };
};
