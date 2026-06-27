import type { ActionResult } from "@typings/actions";

export const API_KEY_USER_CONFIG_ID = "user-keys" as const;
export const API_KEY_ORGANIZATION_CONFIG_ID = "org-keys" as const;
export const API_KEY_HEADER_NAME = "x-api-key" as const;

export type ApiKeyConfigId = typeof API_KEY_USER_CONFIG_ID | typeof API_KEY_ORGANIZATION_CONFIG_ID;

export type ApiKeyPermissionRecord = Record<string, string[]>;

export interface ApiKeyDisplayData {
  id: string;
  key: string;
  start: string | null;
  configId: ApiKeyConfigId;
  referenceId: string;
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
