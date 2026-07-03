export const API_KEY_USER_CONFIG_ID = "user-keys" as const;
export const API_KEY_ORGANIZATION_CONFIG_ID = "org-keys" as const;
export const API_KEY_HEADER_NAME = "x-api-key" as const;

export type ApiKeyConfigId = typeof API_KEY_USER_CONFIG_ID | typeof API_KEY_ORGANIZATION_CONFIG_ID;
