import {
  API_KEY_PERMISSION_PRESETS,
  API_KEY_REQUIRED_PERMISSIONS,
  expandApiKeyPresetIds,
  isApiKeyPermissionPresetId,
  mergeApiKeyPermissions,
} from "@features/api-keys/api-keys-permissions";
import type { ApiKeyPermissionRecord } from "@features/api-keys/api-keys-types";

describe("api key permissions", () => {
  it("defines stable built-in read permissions", () => {
    expect(API_KEY_REQUIRED_PERMISSIONS).toEqual({
      basicRead: { basic: ["read"] },
      organizationRead: { organization: ["read"] },
      organizationMembersRead: { organization: ["read"], member: ["read"] },
      organizationTeamsRead: { organization: ["read"], team: ["read"] },
      organizationTeamMembersRead: {
        organization: ["read"],
        team: ["read"],
        teamMember: ["read"],
      },
    });
  });

  it("expands presets into Better Auth permission records", () => {
    expect(expandApiKeyPresetIds(["organization-members-read", "organization-teams-read"])).toEqual(
      {
        organization: ["read"],
        member: ["read"],
        team: ["read"],
      }
    );
    expect(API_KEY_PERMISSION_PRESETS["organization-read-all"].permissions).toEqual({
      organization: ["read"],
      member: ["read"],
      team: ["read"],
      teamMember: ["read"],
    });
  });

  it("identifies preset ids", () => {
    expect(isApiKeyPermissionPresetId("basic-read")).toBe(true);
    expect(isApiKeyPermissionPresetId("billing-read")).toBe(false);
    expect(isApiKeyPermissionPresetId("toString")).toBe(false);
  });

  it("keeps custom downstream resources and actions extension-friendly", () => {
    const customPermissions = {
      billing: ["read", "write"],
      reports: ["export"],
    } satisfies ApiKeyPermissionRecord;

    expect(mergeApiKeyPermissions([{ basic: ["read"] }, customPermissions])).toEqual({
      basic: ["read"],
      billing: ["read", "write"],
      reports: ["export"],
    });
  });
});
