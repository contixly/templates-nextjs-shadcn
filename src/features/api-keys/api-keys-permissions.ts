import type {
  ApiKeyBuiltInPermissionRecord,
  ApiKeyPermissionRecord,
} from "@features/api-keys/api-keys-types";

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
} satisfies Record<string, ApiKeyBuiltInPermissionRecord>;

export const API_KEY_PERMISSION_PRESETS = {
  "basic-read": {
    labelKey: "presets.basicRead.label",
    descriptionKey: "presets.basicRead.description",
    permissions: { basic: ["read"] },
  },
  "organization-read": {
    labelKey: "presets.organizationRead.label",
    descriptionKey: "presets.organizationRead.description",
    permissions: { organization: ["read"] },
  },
  "organization-members-read": {
    labelKey: "presets.organizationMembersRead.label",
    descriptionKey: "presets.organizationMembersRead.description",
    permissions: { organization: ["read"], member: ["read"] },
  },
  "organization-teams-read": {
    labelKey: "presets.organizationTeamsRead.label",
    descriptionKey: "presets.organizationTeamsRead.description",
    permissions: { organization: ["read"], team: ["read"] },
  },
  "organization-team-members-read": {
    labelKey: "presets.organizationTeamMembersRead.label",
    descriptionKey: "presets.organizationTeamMembersRead.description",
    permissions: { organization: ["read"], team: ["read"], teamMember: ["read"] },
  },
  "organization-read-all": {
    labelKey: "presets.organizationReadAll.label",
    descriptionKey: "presets.organizationReadAll.description",
    permissions: {
      organization: ["read"],
      member: ["read"],
      team: ["read"],
      teamMember: ["read"],
    },
  },
} satisfies Record<
  string,
  {
    labelKey: string;
    descriptionKey: string;
    permissions: ApiKeyBuiltInPermissionRecord;
  }
>;

export type ApiKeyPermissionPresetId = keyof typeof API_KEY_PERMISSION_PRESETS;

export const isApiKeyPermissionPresetId = (value: unknown): value is ApiKeyPermissionPresetId =>
  typeof value === "string" &&
  Object.prototype.hasOwnProperty.call(API_KEY_PERMISSION_PRESETS, value);

export const mergeApiKeyPermissions = (
  records: ApiKeyPermissionRecord[]
): ApiKeyPermissionRecord => {
  const merged = new Map<string, Set<string>>();

  for (const record of records) {
    for (const [resource, actions] of Object.entries(record)) {
      if (!actions) {
        continue;
      }

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
    value: value as ApiKeyPermissionPresetId,
    labelKey: preset.labelKey,
    descriptionKey: preset.descriptionKey,
    permissions: preset.permissions,
  })
);
