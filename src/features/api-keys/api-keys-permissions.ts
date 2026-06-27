import type { ApiKeyPermissionRecord } from "@features/api-keys/api-keys-types";

export const API_KEY_REQUIRED_PERMISSIONS = {
  basicRead: { basic: ["read"] },
  organizationRead: { organization: ["read"] },
  organizationMembersRead: { organization: ["read"], member: ["read"] },
  organizationTeamsRead: { organization: ["read"], team: ["read"] },
  organizationTeamMembersRead: {
    organization: ["read"],
    team: ["read"],
    teamMember: ["read"],
  },
} satisfies Record<string, ApiKeyPermissionRecord>;

export const API_KEY_PERMISSION_PRESETS = {
  "basic-read": {
    label: "Basic read",
    permissions: { basic: ["read"] },
  },
  "organization-read": {
    label: "Organization read",
    permissions: { organization: ["read"] },
  },
  "organization-members-read": {
    label: "Organization members read",
    permissions: { organization: ["read"], member: ["read"] },
  },
  "organization-teams-read": {
    label: "Organization teams read",
    permissions: { organization: ["read"], team: ["read"] },
  },
  "organization-team-members-read": {
    label: "Organization team members read",
    permissions: { organization: ["read"], team: ["read"], teamMember: ["read"] },
  },
  "organization-read-all": {
    label: "Organization read all",
    permissions: {
      organization: ["read"],
      member: ["read"],
      team: ["read"],
      teamMember: ["read"],
    },
  },
} satisfies Record<string, { label: string; permissions: ApiKeyPermissionRecord }>;

export type ApiKeyPermissionPresetId = keyof typeof API_KEY_PERMISSION_PRESETS;

export const isApiKeyPermissionPresetId = (value: unknown): value is ApiKeyPermissionPresetId =>
  typeof value === "string" && value in API_KEY_PERMISSION_PRESETS;

export const mergeApiKeyPermissions = (
  records: ApiKeyPermissionRecord[]
): ApiKeyPermissionRecord => {
  const merged = new Map<string, Set<string>>();

  for (const record of records) {
    for (const [resource, actions] of Object.entries(record)) {
      const resourceActions = merged.get(resource) ?? new Set<string>();
      actions.forEach((action) => resourceActions.add(action));
      merged.set(resource, resourceActions);
    }
  }

  return Object.fromEntries(
    Array.from(merged.entries()).map(([resource, actions]) => [resource, Array.from(actions)])
  );
};

export const expandApiKeyPresetIds = (
  presetIds: ApiKeyPermissionPresetId[]
): ApiKeyPermissionRecord =>
  mergeApiKeyPermissions(
    presetIds.map((presetId) => API_KEY_PERMISSION_PRESETS[presetId].permissions)
  );

export const apiKeyPermissionPresetOptions = Object.entries(API_KEY_PERMISSION_PRESETS).map(
  ([value, preset]) => ({
    value,
    label: preset.label,
  })
);
