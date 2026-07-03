import type { ActionResult } from "@typings/actions";
import {
  API_KEY_HEADER_NAME,
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
} from "@lib/api-key-config";

export {
  API_KEY_HEADER_NAME,
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
};
export type ApiKeyOwnerType = "user" | "organization";
export type ApiKeyStatus = "active" | "disabled" | "expired";

export type ApiKeyBuiltInPermissionResource =
  "basic" | "organization" | "member" | "team" | "teamMember";

export type ApiKeyBuiltInPermissionAction = "read";

export type ApiKeyBuiltInPermissionRecord = Partial<
  Record<ApiKeyBuiltInPermissionResource, ApiKeyBuiltInPermissionAction[]>
>;

export type ApiKeyPermissionRecord = ApiKeyBuiltInPermissionRecord & {
  [resource: string]: string[] | undefined;
};

export interface ApiKeyDisplayData {
  id: string;
  key: string;
  start: string | null;
  configId: ApiKeyConfigId;
  referenceId: string;
}

export interface ApiKeyListItemDto {
  id: string;
  configId: ApiKeyConfigId;
  name: string | null;
  start: string | null;
  prefix: string | null;
  referenceId: string;
  enabled: boolean;
  status: ApiKeyStatus;
  permissions: ApiKeyPermissionRecord | null;
  rateLimitEnabled: boolean;
  rateLimitTimeWindow: number | null;
  rateLimitMax: number | null;
  requestCount: number;
  remaining: number | null;
  lastRequest: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyManagementCapabilities {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface ApiKeyManagementPageData {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  organizationKey?: string;
  keys: ApiKeyListItemDto[];
  capabilities: ApiKeyManagementCapabilities;
}

export type ApiKeyPrincipal =
  | {
      type: "user";
      keyId: string;
      keyStart: string | null;
      configId: typeof API_KEY_USER_CONFIG_ID;
      userId: string;
      permissions: ApiKeyPermissionRecord | null;
    }
  | {
      type: "organization";
      keyId: string;
      keyStart: string | null;
      configId: typeof API_KEY_ORGANIZATION_CONFIG_ID;
      organizationId: string;
      permissions: ApiKeyPermissionRecord | null;
    };

export type CreateApiKeyActionResult = ActionResult<ApiKeyDisplayData>;
