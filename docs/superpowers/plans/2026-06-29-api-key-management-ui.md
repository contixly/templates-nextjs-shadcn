# API Key Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add consistent settings UI for managing personal and organization API keys, including scopes, expiration, rate limits, one-time secret display, and educational guidance.

**Architecture:** Keep pages as Server Components that load safe DTOs, and keep interactive dialogs/tables as focused Client Components under `src/features/api-keys/components/`. Use Better Auth server APIs through protected server actions, never through direct client API calls, so server-only fields such as `permissions` and rate limits stay server-side. Reuse the existing settings shell, shadcn/radix components, React Hook Form, Zod, and `sonner`.

**Tech Stack:** Next.js App Router, React Server Components, Better Auth API Key plugin, Prisma, shadcn/ui radix-lyra, Tabler icons, React Hook Form, Zod, next-intl, Jest.

---

## File Structure

### New Files

- `src/features/api-keys/api-keys-schemas.ts`
  - Form/action schemas and mapping helpers for expiration and rate-limit options.
- `src/features/api-keys/api-keys-management.ts`
  - Server-only list loaders, DTO mappers, status helpers, and capability loaders.
- `src/features/api-keys/actions/update-api-key.ts`
  - Protected server action for rename, enabled state, scopes, expiration, and rate-limit updates.
- `src/features/api-keys/actions/delete-api-key.ts`
  - Protected server action for personal key deletion and organization key deletion.
- `src/features/api-keys/components/api-key-management-page.tsx`
  - Shared page composition for education and table sections.
- `src/features/api-keys/components/api-key-education-section.tsx`
  - Personal versus organization key explanation and organization-page personal-key link.
- `src/features/api-keys/components/api-key-create-dialog.tsx`
  - Create form and one-time secret reveal.
- `src/features/api-keys/components/api-key-edit-dialog.tsx`
  - Edit form.
- `src/features/api-keys/components/api-key-delete-control.tsx`
  - Destructive delete confirmation.
- `src/features/api-keys/components/api-key-permissions-preview.tsx`
  - Read-only derived permission preview.
- `src/features/api-keys/components/api-key-table.tsx`
  - Responsive settings table and row actions.
- `src/messages/features/api-keys.en.json`
- `src/messages/features/api-keys.ru.json`
- `src/app/(protected)/(global)/user/api-keys/page.tsx`
- `src/app/(protected)/(global)/user/api-keys/opengraph-image.tsx`
- `src/app/(protected)/(global)/user/api-keys/twitter-image.ts`
- `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/page.tsx`
- `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/workspace-settings-api-keys-content.tsx`
- `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/opengraph-image.tsx`
- `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/twitter-image.ts`
- `test/features/api-keys/management/api-keys-schemas.test.ts`
- `test/features/api-keys/management/api-keys-management.test.ts`
- `test/features/api-keys/actions/manage-api-key.test.ts`
- `test/features/api-keys/components/api-key-management-page.test.tsx`

### Modified Files

- `src/features/api-keys/api-keys-types.ts`
  - Add DTO types for list items, capabilities, create secret result, and principal targets.
- `src/features/api-keys/api-keys-permissions.ts`
  - Add stable translation keys for preset labels and descriptions.
- `src/features/api-keys/actions/create-api-key.ts`
  - Extend input with expiration and rate-limit fields.
  - Add stable organization permission failure handling.
  - Return UI-safe create result with one-time secret.
- `src/features/api-keys/api-keys-errors.ts`
  - Add validation and management error keys.
- `src/features/accounts/accounts-routes.ts`
  - Add `/user/api-keys`.
- `src/features/accounts/components/nav/nav-user-settings.tsx`
  - Add API keys sidebar item.
- `src/features/workspaces/workspaces-routes.ts`
  - Add `/w/[organizationKey]/settings/api-keys`.
- `src/features/workspaces/components/nav/nav-workspace-settings.tsx`
  - Add API keys sidebar item when readable.
- `src/app/(protected)/(global)/w/[organizationKey]/settings/workspace-settings-nav.tsx`
  - Load `apiKey: ["read"]` capability for the sidebar.
- `src/features/workspaces/workspaces-settings.ts`
  - Add organization API-key settings context loader.
- `src/i18n/messages.ts`
  - Load `apiKeys` messages.
- `src/messages/features/accounts.en.json`
- `src/messages/features/accounts.ru.json`
- `src/messages/features/workspaces.en.json`
- `src/messages/features/workspaces.ru.json`

---

## Task 1: API Key Types, Schemas, Preset Metadata, and DTO Mapping

**Files:**
- Create: `src/features/api-keys/api-keys-schemas.ts`
- Create: `src/features/api-keys/api-keys-management.ts`
- Create: `test/features/api-keys/management/api-keys-schemas.test.ts`
- Create: `test/features/api-keys/management/api-keys-management.test.ts`
- Modify: `src/features/api-keys/api-keys-types.ts`
- Modify: `src/features/api-keys/api-keys-permissions.ts`
- Modify: `src/features/api-keys/api-keys-errors.ts`

- [ ] **Step 1: Write failing schema tests**

Create `test/features/api-keys/management/api-keys-schemas.test.ts`:

```ts
/** @jest-environment node */

import {
  API_KEY_EXPIRATION_OPTIONS,
  API_KEY_RATE_LIMIT_WINDOW_OPTIONS,
  apiKeyCreateFormSchema,
  apiKeyUpdateFormSchema,
  mapApiKeyExpirationOptionToSeconds,
  mapApiKeyRateLimitWindowToMs,
} from "@features/api-keys/api-keys-schemas";

describe("api key form schemas", () => {
  it("maps supported expiration options to Better Auth seconds", () => {
    expect(API_KEY_EXPIRATION_OPTIONS).toEqual(["never", "7d", "30d", "90d", "365d"]);
    expect(mapApiKeyExpirationOptionToSeconds("never")).toBeNull();
    expect(mapApiKeyExpirationOptionToSeconds("7d")).toBe(7 * 24 * 60 * 60);
    expect(mapApiKeyExpirationOptionToSeconds("30d")).toBe(30 * 24 * 60 * 60);
    expect(mapApiKeyExpirationOptionToSeconds("90d")).toBe(90 * 24 * 60 * 60);
    expect(mapApiKeyExpirationOptionToSeconds("365d")).toBe(365 * 24 * 60 * 60);
  });

  it("maps supported rate-limit windows to milliseconds", () => {
    expect(API_KEY_RATE_LIMIT_WINDOW_OPTIONS).toEqual(["1m", "1h", "1d"]);
    expect(mapApiKeyRateLimitWindowToMs("1m")).toBe(60 * 1000);
    expect(mapApiKeyRateLimitWindowToMs("1h")).toBe(60 * 60 * 1000);
    expect(mapApiKeyRateLimitWindowToMs("1d")).toBe(24 * 60 * 60 * 1000);
  });

  it("accepts a valid personal key creation form", () => {
    const parsed = apiKeyCreateFormSchema.safeParse({
      type: "user",
      name: "Local CLI",
      presetIds: ["basic-read", "organization-read"],
      expiresIn: "30d",
      rateLimitEnabled: true,
      rateLimitMax: 1200,
      rateLimitWindow: "1h",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts a valid organization key creation form", () => {
    const parsed = apiKeyCreateFormSchema.safeParse({
      type: "organization",
      organizationId: "org_1",
      name: "Warehouse sync",
      presetIds: ["organization-read-all"],
      expiresIn: "never",
      rateLimitEnabled: false,
      rateLimitMax: 100,
      rateLimitWindow: "1d",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects organization creation without an organization id", () => {
    const parsed = apiKeyCreateFormSchema.safeParse({
      type: "organization",
      name: "Missing org",
      presetIds: ["basic-read"],
      expiresIn: "7d",
      rateLimitEnabled: true,
      rateLimitMax: 100,
      rateLimitWindow: "1h",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("api_keys.organization_id_required");
  });

  it("rejects empty presets and invalid rate limits", () => {
    const parsed = apiKeyCreateFormSchema.safeParse({
      type: "user",
      name: "Bad key",
      presetIds: [],
      expiresIn: "30d",
      rateLimitEnabled: true,
      rateLimitMax: 0,
      rateLimitWindow: "1h",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining(["api_keys.preset_required", "api_keys.rate_limit_max_invalid"])
    );
  });

  it("requires an editable field for update forms", () => {
    const parsed = apiKeyUpdateFormSchema.safeParse({
      type: "user",
      keyId: "key_1",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("api_keys.no_update_values");
  });
});
```

- [ ] **Step 2: Write failing DTO mapping tests**

Create `test/features/api-keys/management/api-keys-management.test.ts`:

```ts
/** @jest-environment node */

import {
  getApiKeyStatus,
  toApiKeyListItemDto,
} from "@features/api-keys/api-keys-management";

describe("api key management DTO mapping", () => {
  const baseKey = {
    id: "key_1",
    configId: "user-keys",
    name: "Local CLI",
    start: "user_abcd",
    prefix: "user_",
    key: "secret-value-that-must-not-leak",
    referenceId: "user_1",
    refillInterval: null,
    refillAmount: null,
    lastRefillAt: null,
    enabled: true,
    rateLimitEnabled: true,
    rateLimitTimeWindow: 86_400_000,
    rateLimitMax: 100,
    requestCount: 4,
    remaining: null,
    lastRequest: new Date("2026-06-20T10:00:00.000Z"),
    expiresAt: null,
    createdAt: new Date("2026-06-10T10:00:00.000Z"),
    updatedAt: new Date("2026-06-11T10:00:00.000Z"),
    permissions: { basic: ["read"] },
    metadata: null,
  };

  it("maps a Better Auth key to a client-safe DTO without the secret", () => {
    const dto = toApiKeyListItemDto(baseKey);

    expect(dto).toEqual({
      id: "key_1",
      configId: "user-keys",
      name: "Local CLI",
      start: "user_abcd",
      prefix: "user_",
      referenceId: "user_1",
      enabled: true,
      status: "active",
      permissions: { basic: ["read"] },
      rateLimitEnabled: true,
      rateLimitTimeWindow: 86_400_000,
      rateLimitMax: 100,
      requestCount: 4,
      remaining: null,
      lastRequest: new Date("2026-06-20T10:00:00.000Z"),
      expiresAt: null,
      createdAt: new Date("2026-06-10T10:00:00.000Z"),
      updatedAt: new Date("2026-06-11T10:00:00.000Z"),
    });
    expect("key" in dto).toBe(false);
  });

  it("marks disabled and expired keys", () => {
    expect(getApiKeyStatus({ enabled: false, expiresAt: null })).toBe("disabled");
    expect(
      getApiKeyStatus({
        enabled: true,
        expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      })
    ).toBe("expired");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/management'
```

Expected:

```text
FAIL test/features/api-keys/management/api-keys-schemas.test.ts
FAIL test/features/api-keys/management/api-keys-management.test.ts
```

The failure should be missing module or missing export errors.

- [ ] **Step 4: Add management error keys**

Modify `src/features/api-keys/api-keys-errors.ts` by adding this export after the imports:

```ts
export const API_KEY_ERROR_KEYS = {
  invalidRequest: "api_keys.invalid_request",
  invalidType: "api_keys.invalid_type",
  nameRequired: "api_keys.name_required",
  nameTooLong: "api_keys.name_too_long",
  organizationIdRequired: "api_keys.organization_id_required",
  presetRequired: "api_keys.preset_required",
  invalidPreset: "api_keys.invalid_preset",
  rateLimitMaxInvalid: "api_keys.rate_limit_max_invalid",
  rateLimitWindowInvalid: "api_keys.rate_limit_window_invalid",
  expirationInvalid: "api_keys.expiration_invalid",
  keyNotFound: "api_keys.key_not_found",
  createFailed: "api_keys.create_failed",
  updateFailed: "api_keys.update_failed",
  deleteFailed: "api_keys.delete_failed",
  permissionDenied: "api_keys.permission_denied",
  noUpdateValues: "api_keys.no_update_values",
} as const;
```

- [ ] **Step 5: Add preset translation metadata**

Modify `src/features/api-keys/api-keys-permissions.ts` so each preset has translation keys:

```ts
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

export const apiKeyPermissionPresetOptions = Object.entries(API_KEY_PERMISSION_PRESETS).map(
  ([value, preset]) => ({
    value: value as ApiKeyPermissionPresetId,
    labelKey: preset.labelKey,
    descriptionKey: preset.descriptionKey,
    permissions: preset.permissions,
  })
);
```

- [ ] **Step 6: Add schema implementation**

Create `src/features/api-keys/api-keys-schemas.ts`:

```ts
import { z } from "zod";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import {
  isApiKeyPermissionPresetId,
  type ApiKeyPermissionPresetId,
} from "@features/api-keys/api-keys-permissions";
import { id } from "@lib/z";

export const API_KEY_NAME_MAX_LENGTH = 32;
export const API_KEY_RATE_LIMIT_MAX_MAX = 1_000_000;
export const API_KEY_EXPIRATION_OPTIONS = ["never", "7d", "30d", "90d", "365d"] as const;
export const API_KEY_RATE_LIMIT_WINDOW_OPTIONS = ["1m", "1h", "1d"] as const;

export type ApiKeyExpirationOption = (typeof API_KEY_EXPIRATION_OPTIONS)[number];
export type ApiKeyRateLimitWindowOption = (typeof API_KEY_RATE_LIMIT_WINDOW_OPTIONS)[number];

const expirationSeconds = {
  never: null,
  "7d": 7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
  "90d": 90 * 24 * 60 * 60,
  "365d": 365 * 24 * 60 * 60,
} satisfies Record<ApiKeyExpirationOption, number | null>;

const rateLimitWindowMs = {
  "1m": 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
} satisfies Record<ApiKeyRateLimitWindowOption, number>;

export const mapApiKeyExpirationOptionToSeconds = (value: ApiKeyExpirationOption) =>
  expirationSeconds[value];

export const mapApiKeyRateLimitWindowToMs = (value: ApiKeyRateLimitWindowOption) =>
  rateLimitWindowMs[value];

const apiKeyNameSchema = z
  .string({ error: API_KEY_ERROR_KEYS.nameRequired })
  .trim()
  .min(1, { message: API_KEY_ERROR_KEYS.nameRequired })
  .max(API_KEY_NAME_MAX_LENGTH, { message: API_KEY_ERROR_KEYS.nameTooLong });

const presetIdsSchema = z
  .array(z.string({ error: API_KEY_ERROR_KEYS.invalidPreset }), {
    error: API_KEY_ERROR_KEYS.presetRequired,
  })
  .min(1, { message: API_KEY_ERROR_KEYS.presetRequired })
  .refine((presetIds) => presetIds.every(isApiKeyPermissionPresetId), {
    message: API_KEY_ERROR_KEYS.invalidPreset,
  })
  .transform((presetIds) => presetIds as ApiKeyPermissionPresetId[]);

const expirationSchema = z.enum(API_KEY_EXPIRATION_OPTIONS, {
  error: API_KEY_ERROR_KEYS.expirationInvalid,
});

const rateLimitWindowSchema = z.enum(API_KEY_RATE_LIMIT_WINDOW_OPTIONS, {
  error: API_KEY_ERROR_KEYS.rateLimitWindowInvalid,
});

const rateLimitMaxSchema = z
  .number({ error: API_KEY_ERROR_KEYS.rateLimitMaxInvalid })
  .int({ message: API_KEY_ERROR_KEYS.rateLimitMaxInvalid })
  .min(1, { message: API_KEY_ERROR_KEYS.rateLimitMaxInvalid })
  .max(API_KEY_RATE_LIMIT_MAX_MAX, { message: API_KEY_ERROR_KEYS.rateLimitMaxInvalid });

const apiKeyEditableFieldsSchema = z.object({
  name: apiKeyNameSchema.optional(),
  presetIds: presetIdsSchema.optional(),
  expiresIn: expirationSchema.optional(),
  rateLimitEnabled: z.boolean().optional(),
  rateLimitMax: rateLimitMaxSchema.optional(),
  rateLimitWindow: rateLimitWindowSchema.optional(),
  enabled: z.boolean().optional(),
});

export const apiKeyCreateFormSchema = z
  .object({
    type: z.enum(["user", "organization"], { error: API_KEY_ERROR_KEYS.invalidType }),
    organizationId: organizationIdSchema.optional(),
    name: apiKeyNameSchema,
    presetIds: presetIdsSchema,
    expiresIn: expirationSchema,
    rateLimitEnabled: z.boolean(),
    rateLimitMax: rateLimitMaxSchema,
    rateLimitWindow: rateLimitWindowSchema,
  })
  .superRefine((value, ctx) => {
    if (value.type === "organization" && !value.organizationId) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: API_KEY_ERROR_KEYS.organizationIdRequired,
      });
    }
  });

export const apiKeyUpdateFormSchema = z
  .object({
    type: z.enum(["user", "organization"], { error: API_KEY_ERROR_KEYS.invalidType }),
    organizationId: organizationIdSchema.optional(),
    keyId: id,
  })
  .merge(apiKeyEditableFieldsSchema)
  .superRefine((value, ctx) => {
    if (value.type === "organization" && !value.organizationId) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: API_KEY_ERROR_KEYS.organizationIdRequired,
      });
    }

    const hasUpdateValues =
      value.name !== undefined ||
      value.presetIds !== undefined ||
      value.expiresIn !== undefined ||
      value.rateLimitEnabled !== undefined ||
      value.rateLimitMax !== undefined ||
      value.rateLimitWindow !== undefined ||
      value.enabled !== undefined;

    if (!hasUpdateValues) {
      ctx.addIssue({
        code: "custom",
        message: API_KEY_ERROR_KEYS.noUpdateValues,
      });
    }
  });

export const apiKeyDeleteFormSchema = z
  .object({
    type: z.enum(["user", "organization"], { error: API_KEY_ERROR_KEYS.invalidType }),
    organizationId: organizationIdSchema.optional(),
    keyId: id,
  })
  .superRefine((value, ctx) => {
    if (value.type === "organization" && !value.organizationId) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: API_KEY_ERROR_KEYS.organizationIdRequired,
      });
    }
  });

export type ApiKeyCreateFormInput = z.input<typeof apiKeyCreateFormSchema>;
export type ApiKeyCreateInput = z.output<typeof apiKeyCreateFormSchema>;
export type ApiKeyUpdateFormInput = z.input<typeof apiKeyUpdateFormSchema>;
export type ApiKeyUpdateInput = z.output<typeof apiKeyUpdateFormSchema>;
export type ApiKeyDeleteInput = z.output<typeof apiKeyDeleteFormSchema>;
```

- [ ] **Step 7: Add DTO types**

Modify `src/features/api-keys/api-keys-types.ts` by adding these exports:

```ts
export type ApiKeyOwnerType = "user" | "organization";

export type ApiKeyStatus = "active" | "disabled" | "expired";

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
```

- [ ] **Step 8: Add DTO mapping and status helpers**

Create `src/features/api-keys/api-keys-management.ts` with this starter implementation:

```ts
import "server-only";

import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUserId, loadRequestHeaders } from "@features/accounts/accounts-actions";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
  type ApiKeyListItemDto,
  type ApiKeyManagementCapabilities,
  type ApiKeyPermissionRecord,
  type ApiKeyStatus,
} from "@features/api-keys/api-keys-types";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { auth } from "@server/auth";

type BetterAuthApiKeyListItem = {
  id: string;
  configId: string;
  name: string | null;
  start: string | null;
  prefix: string | null;
  referenceId: string;
  enabled: boolean;
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
};

type BetterAuthListApiKeysResponse = {
  apiKeys: BetterAuthApiKeyListItem[];
  total: number;
};

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

export const toApiKeyListItemDto = (apiKey: BetterAuthApiKeyListItem): ApiKeyListItemDto => {
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
    status: getApiKeyStatus({ enabled: apiKey.enabled, expiresAt: apiKey.expiresAt }),
    permissions: apiKey.permissions,
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

const requireCurrentUserId = async () => {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  return userId;
};

export const loadPersonalApiKeysPageData = async () => {
  await requireCurrentUserId();
  const response = (await auth.api.listApiKeys({
    headers: await loadRequestHeaders(),
    query: {
      configId: API_KEY_USER_CONFIG_ID,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
  })) as BetterAuthListApiKeysResponse;

  return {
    ownerType: "user" as const,
    keys: response.apiKeys.map(toApiKeyListItemDto),
    capabilities: {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    } satisfies ApiKeyManagementCapabilities,
  };
};

export const loadOrganizationApiKeyCapabilities = async (
  organizationId: string
): Promise<ApiKeyManagementCapabilities & { canRead: boolean }> => {
  const [canRead, canCreate, canUpdate, canDelete] = await Promise.all([
    hasWorkspacePermission(organizationId, { apiKey: ["read"] }),
    hasWorkspacePermission(organizationId, { apiKey: ["create"] }),
    hasWorkspacePermission(organizationId, { apiKey: ["update"] }),
    hasWorkspacePermission(organizationId, { apiKey: ["delete"] }),
  ]);

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
  };
};

export const loadOrganizationApiKeysPageData = async ({
  organizationId,
  organizationKey,
}: {
  organizationId: string;
  organizationKey: string;
}) => {
  await requireCurrentUserId();
  const capabilities = await loadOrganizationApiKeyCapabilities(organizationId);

  if (!capabilities.canRead) {
    forbidden();
  }

  const response = (await auth.api.listApiKeys({
    headers: await loadRequestHeaders(),
    query: {
      configId: API_KEY_ORGANIZATION_CONFIG_ID,
      organizationId,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
  })) as BetterAuthListApiKeysResponse;

  return {
    ownerType: "organization" as const,
    organizationId,
    organizationKey,
    keys: response.apiKeys.map(toApiKeyListItemDto),
    capabilities: {
      canCreate: capabilities.canCreate,
      canUpdate: capabilities.canUpdate,
      canDelete: capabilities.canDelete,
    },
  };
};
```

- [ ] **Step 9: Run focused tests**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/management'
```

Expected:

```text
PASS test/features/api-keys/management/api-keys-schemas.test.ts
PASS test/features/api-keys/management/api-keys-management.test.ts
```

- [ ] **Step 10: Commit Task 1**

```bash
git add src/features/api-keys test/features/api-keys/management
git commit -m "feat: add api key management schemas"
```

---

## Task 2: Protected Create, Update, and Delete Server Actions

**Files:**
- Create: `src/features/api-keys/actions/update-api-key.ts`
- Create: `src/features/api-keys/actions/delete-api-key.ts`
- Create: `test/features/api-keys/actions/manage-api-key.test.ts`
- Modify: `src/features/api-keys/actions/create-api-key.ts`

- [ ] **Step 1: Write failing action tests**

Create `test/features/api-keys/actions/manage-api-key.test.ts`:

```ts
/** @jest-environment node */

const createApiKeyMock = jest.fn();
const updateApiKeyMock = jest.fn();
const deleteApiKeyMock = jest.fn();
const loadCurrentUserIdMock = jest.fn();
const hasWorkspacePermissionMock = jest.fn();

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      createApiKey: (...args: unknown[]) => createApiKeyMock(...args),
      updateApiKey: (...args: unknown[]) => updateApiKeyMock(...args),
      deleteApiKey: (...args: unknown[]) => deleteApiKeyMock(...args),
    },
  },
}));

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => loadCurrentUserIdMock(...args),
  loadRequestHeaders: jest.fn(async () => new Headers()),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => hasWorkspacePermissionMock(...args),
}));

jest.mock("next/navigation", () => ({
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { createApiKeyForCurrentUser } from "@features/api-keys/actions/create-api-key";
import { deleteApiKeyForCurrentUser } from "@features/api-keys/actions/delete-api-key";
import { updateApiKeyForCurrentUser } from "@features/api-keys/actions/update-api-key";

describe("API key management actions", () => {
  beforeEach(() => {
    createApiKeyMock.mockReset();
    updateApiKeyMock.mockReset();
    deleteApiKeyMock.mockReset();
    loadCurrentUserIdMock.mockReset();
    hasWorkspacePermissionMock.mockReset();
    loadCurrentUserIdMock.mockResolvedValue("user_1");
    hasWorkspacePermissionMock.mockResolvedValue(true);
    createApiKeyMock.mockResolvedValue({
      id: "key_1",
      key: "secret",
      start: "user_abcd",
      configId: "user-keys",
      referenceId: "user_1",
      name: "Local CLI",
      prefix: "user_",
      enabled: true,
      permissions: { basic: ["read"] },
      rateLimitEnabled: true,
      rateLimitTimeWindow: 3_600_000,
      rateLimitMax: 100,
      requestCount: 0,
      remaining: null,
      lastRequest: null,
      expiresAt: null,
      createdAt: new Date("2026-06-29T00:00:00.000Z"),
      updatedAt: new Date("2026-06-29T00:00:00.000Z"),
    });
    updateApiKeyMock.mockResolvedValue({
      id: "key_1",
      configId: "user-keys",
      referenceId: "user_1",
      name: "Renamed",
      start: "user_abcd",
      prefix: "user_",
      enabled: true,
      permissions: { basic: ["read"] },
      rateLimitEnabled: false,
      rateLimitTimeWindow: 86_400_000,
      rateLimitMax: 100,
      requestCount: 0,
      remaining: null,
      lastRequest: null,
      expiresAt: null,
      createdAt: new Date("2026-06-29T00:00:00.000Z"),
      updatedAt: new Date("2026-06-29T00:00:00.000Z"),
    });
    deleteApiKeyMock.mockResolvedValue({ success: true });
  });

  it("creates a personal key with expiration and rate limit server fields", async () => {
    await createApiKeyForCurrentUser({
      type: "user",
      name: "Local CLI",
      presetIds: ["basic-read"],
      expiresIn: "30d",
      rateLimitEnabled: true,
      rateLimitMax: 100,
      rateLimitWindow: "1h",
    });

    expect(createApiKeyMock).toHaveBeenCalledWith({
      body: expect.objectContaining({
        configId: "user-keys",
        userId: "user_1",
        name: "Local CLI",
        permissions: { basic: ["read"] },
        expiresIn: 30 * 24 * 60 * 60,
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitTimeWindow: 60 * 60 * 1000,
      }),
    });
  });

  it("checks organization create permission before creating an organization key", async () => {
    await createApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org_1",
      name: "Org sync",
      presetIds: ["organization-read-all"],
      expiresIn: "never",
      rateLimitEnabled: false,
      rateLimitMax: 100,
      rateLimitWindow: "1d",
    });

    expect(hasWorkspacePermissionMock).toHaveBeenCalledWith("org_1", { apiKey: ["create"] });
    expect(createApiKeyMock).toHaveBeenCalledWith({
      body: expect.objectContaining({
        configId: "org-keys",
        organizationId: "org_1",
        userId: "user_1",
        expiresIn: null,
        rateLimitEnabled: false,
      }),
    });
  });

  it("rejects organization create without apiKey create permission", async () => {
    hasWorkspacePermissionMock.mockResolvedValue(false);

    await expect(
      createApiKeyForCurrentUser({
        type: "organization",
        organizationId: "org_1",
        name: "Org sync",
        presetIds: ["organization-read-all"],
        expiresIn: "never",
        rateLimitEnabled: false,
        rateLimitMax: 100,
        rateLimitWindow: "1d",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        code: 403,
        message: "api_keys.permission_denied",
      },
    });
    expect(createApiKeyMock).not.toHaveBeenCalled();
  });

  it("updates a personal key with server-only fields", async () => {
    await updateApiKeyForCurrentUser({
      type: "user",
      keyId: "key_1",
      name: "Renamed",
      presetIds: ["basic-read"],
      expiresIn: "7d",
      rateLimitEnabled: true,
      rateLimitMax: 50,
      rateLimitWindow: "1m",
    });

    expect(updateApiKeyMock).toHaveBeenCalledWith({
      body: expect.objectContaining({
        configId: "user-keys",
        keyId: "key_1",
        userId: "user_1",
        name: "Renamed",
        permissions: { basic: ["read"] },
        expiresIn: 7 * 24 * 60 * 60,
        rateLimitEnabled: true,
        rateLimitMax: 50,
        rateLimitTimeWindow: 60 * 1000,
      }),
    });
  });

  it("checks organization update and delete permissions", async () => {
    await updateApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org_1",
      keyId: "key_1",
      enabled: false,
    });
    await deleteApiKeyForCurrentUser({
      type: "organization",
      organizationId: "org_1",
      keyId: "key_1",
    });

    expect(hasWorkspacePermissionMock).toHaveBeenCalledWith("org_1", { apiKey: ["update"] });
    expect(hasWorkspacePermissionMock).toHaveBeenCalledWith("org_1", { apiKey: ["delete"] });
    expect(updateApiKeyMock).toHaveBeenCalledWith({
      body: expect.objectContaining({
        configId: "org-keys",
        keyId: "key_1",
        userId: "user_1",
        enabled: false,
      }),
    });
    expect(deleteApiKeyMock).toHaveBeenCalledWith({
      body: {
        configId: "org-keys",
        keyId: "key_1",
      },
      headers: expect.any(Headers),
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/actions'
```

Expected:

```text
FAIL test/features/api-keys/actions/manage-api-key.test.ts
```

The failure should mention missing `update-api-key` and `delete-api-key` modules or unsupported create fields.

- [ ] **Step 3: Extend create action input and body mapping**

Modify `src/features/api-keys/actions/create-api-key.ts`:

- Import:

```ts
import { HttpCodes } from "@typings/network";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import {
  apiKeyCreateFormSchema,
  mapApiKeyExpirationOptionToSeconds,
  mapApiKeyRateLimitWindowToMs,
} from "@features/api-keys/api-keys-schemas";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
```

- Replace the local `createApiKeyInputSchema` with `apiKeyCreateFormSchema`.
- Keep `CreateApiKeyInput` exported from the schema output:

```ts
export type CreateApiKeyInput = z.output<typeof apiKeyCreateFormSchema>;
```

- Before calling Better Auth for an organization key, add:

```ts
const canCreateOrganizationKey =
  parsed.data.type !== "organization" ||
  (await hasWorkspacePermission(parsed.data.organizationId, { apiKey: ["create"] }));

if (!canCreateOrganizationKey) {
  return {
    success: false,
    error: {
      code: HttpCodes.FORBIDDEN,
      message: API_KEY_ERROR_KEYS.permissionDenied,
    },
  };
}
```

- Add the Better Auth body fields:

```ts
expiresIn: mapApiKeyExpirationOptionToSeconds(parsed.data.expiresIn),
rateLimitEnabled: parsed.data.rateLimitEnabled,
rateLimitMax: parsed.data.rateLimitMax,
rateLimitTimeWindow: mapApiKeyRateLimitWindowToMs(parsed.data.rateLimitWindow),
```

- Keep the returned `key` only in the create result.

- [ ] **Step 4: Implement update action**

Create `src/features/api-keys/actions/update-api-key.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";
import { loadCurrentUserId, loadRequestHeaders } from "@features/accounts/accounts-actions";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import {
  expandApiKeyPresetIds,
  type ApiKeyPermissionPresetId,
} from "@features/api-keys/api-keys-permissions";
import {
  apiKeyUpdateFormSchema,
  mapApiKeyExpirationOptionToSeconds,
  mapApiKeyRateLimitWindowToMs,
  type ApiKeyUpdateInput,
} from "@features/api-keys/api-keys-schemas";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyListItemDto,
} from "@features/api-keys/api-keys-types";
import { toApiKeyListItemDto } from "@features/api-keys/api-keys-management";
import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import routes from "@features/routes";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { auth } from "@server/auth";
import type { ActionResult } from "@typings/actions";
import { HttpCodes } from "@typings/network";

const updateFailure = (message = API_KEY_ERROR_KEYS.updateFailed): ActionResult<ApiKeyListItemDto> => ({
  success: false,
  error: {
    code: HttpCodes.SERVER_ERROR,
    message,
  },
});

const getRevalidationPath = (input: ApiKeyUpdateInput) =>
  input.type === "organization" && input.organizationId
    ? routes.workspaces.pages.settings_api_keys.path({ organizationKey: input.organizationId })
    : routes.accounts.pages.api_keys.path();

export const updateApiKeyForCurrentUser = async (
  input: ApiKeyUpdateInput
): Promise<ActionResult<ApiKeyListItemDto>> => {
  const parsed = apiKeyUpdateFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: HttpCodes.BAD_REQUEST,
        message: parsed.error.issues[0]?.message ?? API_KEY_ERROR_KEYS.invalidRequest,
      },
    };
  }

  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  if (parsed.data.type === "organization") {
    const canUpdate = await hasWorkspacePermission(parsed.data.organizationId, {
      apiKey: ["update"],
    });

    if (!canUpdate) {
      return {
        success: false,
        error: {
          code: HttpCodes.FORBIDDEN,
          message: API_KEY_ERROR_KEYS.permissionDenied,
        },
      };
    }
  }

  const body: Record<string, unknown> = {
    configId:
      parsed.data.type === "organization"
        ? API_KEY_ORGANIZATION_CONFIG_ID
        : API_KEY_USER_CONFIG_ID,
    keyId: parsed.data.keyId,
    userId,
  };

  if (parsed.data.name !== undefined) body.name = parsed.data.name;
  if (parsed.data.enabled !== undefined) body.enabled = parsed.data.enabled;
  if (parsed.data.presetIds !== undefined) {
    body.permissions = expandApiKeyPresetIds(parsed.data.presetIds as ApiKeyPermissionPresetId[]);
  }
  if (parsed.data.expiresIn !== undefined) {
    body.expiresIn = mapApiKeyExpirationOptionToSeconds(parsed.data.expiresIn);
  }
  if (parsed.data.rateLimitEnabled !== undefined) {
    body.rateLimitEnabled = parsed.data.rateLimitEnabled;
  }
  if (parsed.data.rateLimitMax !== undefined) {
    body.rateLimitMax = parsed.data.rateLimitMax;
  }
  if (parsed.data.rateLimitWindow !== undefined) {
    body.rateLimitTimeWindow = mapApiKeyRateLimitWindowToMs(parsed.data.rateLimitWindow);
  }

  try {
    const updated = await auth.api.updateApiKey({ body });
    const data = toApiKeyListItemDto(updated as Parameters<typeof toApiKeyListItemDto>[0]);

    revalidatePath(getRevalidationPath(parsed.data));

    return {
      success: true,
      data,
    };
  } catch (error) {
    apiKeysLogger.child({ function: "updateApiKeyForCurrentUser", userId }).error({
      error: error instanceof Error ? error.message : String(error),
    });

    return updateFailure();
  }
};
```

- [ ] **Step 5: Implement delete action**

Create `src/features/api-keys/actions/delete-api-key.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";
import { loadCurrentUserId, loadRequestHeaders } from "@features/accounts/accounts-actions";
import { API_KEY_ERROR_KEYS } from "@features/api-keys/api-keys-errors";
import {
  apiKeyDeleteFormSchema,
  type ApiKeyDeleteInput,
} from "@features/api-keys/api-keys-schemas";
import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
} from "@features/api-keys/api-keys-types";
import { apiKeysLogger } from "@features/api-keys/api-keys-logger";
import routes from "@features/routes";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import { auth } from "@server/auth";
import type { ActionResult } from "@typings/actions";
import { HttpCodes } from "@typings/network";

const getRevalidationPath = (input: ApiKeyDeleteInput) =>
  input.type === "organization" && input.organizationId
    ? routes.workspaces.pages.settings_api_keys.path({ organizationKey: input.organizationId })
    : routes.accounts.pages.api_keys.path();

export const deleteApiKeyForCurrentUser = async (
  input: ApiKeyDeleteInput
): Promise<ActionResult<{ keyId: string }>> => {
  const parsed = apiKeyDeleteFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: HttpCodes.BAD_REQUEST,
        message: parsed.error.issues[0]?.message ?? API_KEY_ERROR_KEYS.invalidRequest,
      },
    };
  }

  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  if (parsed.data.type === "organization") {
    const canDelete = await hasWorkspacePermission(parsed.data.organizationId, {
      apiKey: ["delete"],
    });

    if (!canDelete) {
      return {
        success: false,
        error: {
          code: HttpCodes.FORBIDDEN,
          message: API_KEY_ERROR_KEYS.permissionDenied,
        },
      };
    }
  }

  try {
    await auth.api.deleteApiKey({
      body: {
        configId:
          parsed.data.type === "organization"
            ? API_KEY_ORGANIZATION_CONFIG_ID
            : API_KEY_USER_CONFIG_ID,
        keyId: parsed.data.keyId,
      },
      headers: await loadRequestHeaders(),
    });

    revalidatePath(getRevalidationPath(parsed.data));

    return {
      success: true,
      data: {
        keyId: parsed.data.keyId,
      },
    };
  } catch (error) {
    apiKeysLogger.child({ function: "deleteApiKeyForCurrentUser", userId }).error({
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: {
        code: HttpCodes.SERVER_ERROR,
        message: API_KEY_ERROR_KEYS.deleteFailed,
      },
    };
  }
};
```

- [ ] **Step 6: Run action tests**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/actions'
```

Expected:

```text
PASS test/features/api-keys/actions/create-api-key.test.ts
PASS test/features/api-keys/actions/manage-api-key.test.ts
```

- [ ] **Step 7: Commit Task 2**

```bash
git add src/features/api-keys/actions src/features/api-keys/api-keys-errors.ts test/features/api-keys/actions
git commit -m "feat: add api key management actions"
```

---

## Task 3: Routes, Navigation, Page Loaders, and i18n

**Files:**
- Create route files listed in the File Structure section.
- Create: `src/messages/features/api-keys.en.json`
- Create: `src/messages/features/api-keys.ru.json`
- Modify: `src/i18n/messages.ts`
- Modify: `src/features/accounts/accounts-routes.ts`
- Modify: `src/features/accounts/components/nav/nav-user-settings.tsx`
- Modify: `src/features/workspaces/workspaces-routes.ts`
- Modify: `src/features/workspaces/components/nav/nav-workspace-settings.tsx`
- Modify: `src/app/(protected)/(global)/w/[organizationKey]/settings/workspace-settings-nav.tsx`
- Modify: `src/features/workspaces/workspaces-settings.ts`
- Modify account and workspace message JSON files.

- [ ] **Step 1: Add route keys**

Modify `src/features/accounts/accounts-routes.ts`:

```ts
import {
  IconAlertTriangle,
  IconKey,
  IconLink,
  IconLogin,
  IconMail,
  IconShield,
  IconUser,
} from "@tabler/icons-react";

type AccountsPages =
  | "login"
  | "error"
  | "welcome"
  | "user"
  | "profile"
  | "invitations"
  | "invitation"
  | "connections"
  | "security"
  | "api_keys"
  | "danger";
```

Add the page descriptor before `danger`:

```ts
api_keys: {
  parent: "user",
  pathTemplate: "/user/api-keys",
  icon: IconKey,

  hidePageHeader: true,
},
```

Modify `src/features/workspaces/workspaces-routes.ts`:

```ts
import {
  IconKey,
  IconMail,
  IconSettings,
  IconShield,
  IconTableShare,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

export type WorkspaceSettingsPages =
  | "settings_workspace"
  | "settings_invitations"
  | "settings_users"
  | "settings_teams"
  | "settings_roles"
  | "settings_api_keys";
```

Add the page descriptor after `settings_roles`:

```ts
settings_api_keys: {
  parent: "workspace",
  pathTemplate: "/w/[organizationKey]/settings/api-keys",
  icon: IconKey,
  hidePageHeader: true,
},
```

- [ ] **Step 2: Add sidebar items**

Modify `src/features/accounts/components/nav/nav-user-settings.tsx`:

```tsx
const apiKeysTranslations = usePageTranslations(routes.accounts.pages.api_keys);

const navItems = [
  getMenuItem(routes.accounts.pages.profile, profileTranslations.title),
  getMenuItem(routes.accounts.pages.invitations, invitationsTranslations.title),
  getMenuItem(routes.accounts.pages.connections, connectionsTranslations.title),
  getMenuItem(routes.accounts.pages.security, securityTranslations.title),
  getMenuItem(routes.accounts.pages.api_keys, apiKeysTranslations.title),
  { ...getMenuItem(routes.accounts.pages.danger, dangerTranslations.title), isDanger: true },
] as (MenuItem & { isDanger?: boolean })[];
```

Modify `src/features/workspaces/components/nav/nav-workspace-settings.tsx` props:

```ts
interface NavWorkspaceSettingsProps {
  organizationKey: string;
  canCreateInvitations?: boolean;
  canReadApiKeys?: boolean;
  hideGroupLabel?: boolean;
}
```

Add translations:

```ts
const apiKeysTranslations = usePageTranslations(routes.workspaces.pages.settings_api_keys);
```

Add the nav item:

```ts
if (canReadApiKeys) {
  navItems.push(
    getMenuItem(routes.workspaces.pages.settings_api_keys, apiKeysTranslations.title, {
      organizationKey,
    })
  );
}
```

- [ ] **Step 3: Load workspace API-key sidebar capability**

Modify `src/app/(protected)/(global)/w/[organizationKey]/settings/workspace-settings-nav.tsx`:

```tsx
export async function WorkspaceSettingsNav({
  organizationId,
  organizationKey,
}: Readonly<{
  organizationId: string;
  organizationKey: string;
}>) {
  const [canCreateInvitations, canReadApiKeys] = await Promise.all([
    hasWorkspacePermission(organizationId, {
      invitation: ["create"],
    }),
    hasWorkspacePermission(organizationId, {
      apiKey: ["read"],
    }),
  ]);

  return (
    <NavWorkspaceSettings
      organizationKey={organizationKey}
      canCreateInvitations={canCreateInvitations}
      canReadApiKeys={canReadApiKeys}
    />
  );
}
```

- [ ] **Step 4: Add organization API-key settings context**

Modify `src/features/workspaces/workspaces-settings.ts`:

```ts
export interface WorkspaceSettingsApiKeysPageContext extends WorkspaceSettingsPageContext {
  canReadApiKeys: boolean;
  canCreateApiKeys: boolean;
  canUpdateApiKeys: boolean;
  canDeleteApiKeys: boolean;
}

export const loadWorkspaceSettingsApiKeysPageContext = async (
  organizationKey: string
): Promise<WorkspaceSettingsApiKeysPageContext> => {
  const userId = await loadRequiredCurrentUserId();
  const workspaceContext = await loadWorkspaceSettingsPageContextForUser(organizationKey, userId);
  const [canReadApiKeys, canCreateApiKeys, canUpdateApiKeys, canDeleteApiKeys] =
    await Promise.all([
      hasWorkspacePermission(workspaceContext.workspace.id, { apiKey: ["read"] }),
      hasWorkspacePermission(workspaceContext.workspace.id, { apiKey: ["create"] }),
      hasWorkspacePermission(workspaceContext.workspace.id, { apiKey: ["update"] }),
      hasWorkspacePermission(workspaceContext.workspace.id, { apiKey: ["delete"] }),
    ]);

  return {
    ...workspaceContext,
    canReadApiKeys,
    canCreateApiKeys,
    canUpdateApiKeys,
    canDeleteApiKeys,
  };
};
```

- [ ] **Step 5: Add i18n namespace loading**

Create `src/messages/features/api-keys.en.json` with the keys used by components:

```json
{
  "ui": {
    "education": {
      "title": "Personal vs organization keys",
      "description": "Choose the key type that matches how your integration should act.",
      "personalTitle": "Personal keys",
      "personalDescription": "Personal keys act as your user account. Organization API routes only return data that your current organization membership allows.",
      "organizationTitle": "Organization keys",
      "organizationDescription": "Organization keys act as a service principal for one organization. They are not reduced when the creator later changes role or leaves.",
      "scopesTitle": "Scopes still apply",
      "scopesDescription": "Both key types are limited by the API scopes selected on the key.",
      "managementTitle": "Organization key management",
      "managementDescription": "Only roles with API key permissions can create, edit, or delete organization keys.",
      "personalLink": "Manage personal keys"
    },
    "table": {
      "title": "API keys",
      "personalDescription": "Create and manage keys that act as your user account.",
      "organizationDescription": "Create and manage keys that act for this organization.",
      "readOnlyNotice": "You can review organization keys, but your role cannot change them.",
      "createAction": "Create key",
      "emptyTitle": "No API keys",
      "emptyDescription": "Create a key when an external integration needs API access.",
      "columns": {
        "name": "Name",
        "key": "Key",
        "scopes": "Scopes",
        "rateLimit": "Rate limit",
        "expires": "Expires",
        "lastUsed": "Last used",
        "created": "Created",
        "actions": "Actions"
      },
      "status": {
        "active": "Active",
        "disabled": "Disabled",
        "expired": "Expired"
      },
      "never": "Never",
      "notUsed": "Not used",
      "unlimited": "Unlimited",
      "actions": {
        "edit": "Edit",
        "enable": "Enable",
        "disable": "Disable",
        "delete": "Delete"
      }
    },
    "form": {
      "nameLabel": "Name",
      "namePlaceholder": "Local CLI",
      "expirationLabel": "Expiration",
      "rateLimitEnabledLabel": "Rate limit",
      "rateLimitMaxLabel": "Max requests",
      "rateLimitWindowLabel": "Window",
      "scopesLabel": "Scopes",
      "permissionsPreviewTitle": "Permissions preview",
      "createTitle": "Create API key",
      "createDescription": "The secret is shown only once after creation.",
      "editTitle": "Edit API key",
      "editDescription": "Changes apply to future API requests that use this key.",
      "createSuccess": "API key created",
      "updateSuccess": "API key updated",
      "deleteSuccess": "API key deleted",
      "errorTitle": "API key action failed",
      "unknownError": "Unknown error",
      "secretTitle": "Copy the API key",
      "secretDescription": "This secret will not be shown again.",
      "createAnother": "Create another key"
    },
    "expiration": {
      "never": "Never",
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "365d": "1 year"
    },
    "rateLimitWindow": {
      "1m": "1 minute",
      "1h": "1 hour",
      "1d": "1 day"
    },
    "presets": {
      "basicRead": {
        "label": "Basic read",
        "description": "Read the current API principal metadata."
      },
      "organizationRead": {
        "label": "Organization read",
        "description": "Read organization records available to the key."
      },
      "organizationMembersRead": {
        "label": "Organization members read",
        "description": "Read organization member lists."
      },
      "organizationTeamsRead": {
        "label": "Organization teams read",
        "description": "Read organization team lists."
      },
      "organizationTeamMembersRead": {
        "label": "Organization team members read",
        "description": "Read team membership."
      },
      "organizationReadAll": {
        "label": "Organization read all",
        "description": "Read organization, members, teams, and team members."
      }
    }
  }
}
```

Create `src/messages/features/api-keys.ru.json`:

```json
{
  "ui": {
    "education": {
      "title": "Личные и организационные ключи",
      "description": "Выберите тип ключа под то, от чьего имени должна работать интеграция.",
      "personalTitle": "Личные ключи",
      "personalDescription": "Личные ключи действуют как ваша учетная запись. Ручки API организации возвращают только данные, доступные через ваше текущее участие в организации.",
      "organizationTitle": "Ключи организации",
      "organizationDescription": "Ключи организации действуют как сервисный principal одной организации. Их доступ не уменьшается, если роль создателя позже изменится или создатель покинет организацию.",
      "scopesTitle": "Scopes все равно ограничивают доступ",
      "scopesDescription": "Оба типа ключей дополнительно ограничены API scopes, выбранными на ключе.",
      "managementTitle": "Управление ключами организации",
      "managementDescription": "Создавать, редактировать и удалять ключи организации могут только роли с правами на API-ключи.",
      "personalLink": "Управлять личными ключами"
    },
    "table": {
      "title": "API-ключи",
      "personalDescription": "Создавайте и управляйте ключами, которые действуют как ваша учетная запись.",
      "organizationDescription": "Создавайте и управляйте ключами, которые действуют от имени этой организации.",
      "readOnlyNotice": "Вы можете просматривать ключи организации, но ваша роль не позволяет изменять их.",
      "createAction": "Создать ключ",
      "emptyTitle": "API-ключей нет",
      "emptyDescription": "Создайте ключ, когда внешней интеграции нужен доступ к API.",
      "columns": {
        "name": "Название",
        "key": "Ключ",
        "scopes": "Scopes",
        "rateLimit": "Rate limit",
        "expires": "Истекает",
        "lastUsed": "Последнее использование",
        "created": "Создан",
        "actions": "Действия"
      },
      "status": {
        "active": "Активен",
        "disabled": "Отключен",
        "expired": "Истек"
      },
      "never": "Никогда",
      "notUsed": "Не использовался",
      "unlimited": "Без лимита",
      "actions": {
        "edit": "Редактировать",
        "enable": "Включить",
        "disable": "Отключить",
        "delete": "Удалить"
      }
    },
    "form": {
      "nameLabel": "Название",
      "namePlaceholder": "Local CLI",
      "expirationLabel": "Срок действия",
      "rateLimitEnabledLabel": "Rate limit",
      "rateLimitMaxLabel": "Максимум запросов",
      "rateLimitWindowLabel": "Окно",
      "scopesLabel": "Scopes",
      "permissionsPreviewTitle": "Предпросмотр permissions",
      "createTitle": "Создать API-ключ",
      "createDescription": "Секрет будет показан только один раз после создания.",
      "editTitle": "Редактировать API-ключ",
      "editDescription": "Изменения применятся к будущим API-запросам с этим ключом.",
      "createSuccess": "API-ключ создан",
      "updateSuccess": "API-ключ обновлен",
      "deleteSuccess": "API-ключ удален",
      "errorTitle": "Действие с API-ключом не выполнено",
      "unknownError": "Неизвестная ошибка",
      "secretTitle": "Скопируйте API-ключ",
      "secretDescription": "Этот секрет больше не будет показан.",
      "createAnother": "Создать еще один ключ"
    },
    "expiration": {
      "never": "Никогда",
      "7d": "7 дней",
      "30d": "30 дней",
      "90d": "90 дней",
      "365d": "1 год"
    },
    "rateLimitWindow": {
      "1m": "1 минута",
      "1h": "1 час",
      "1d": "1 день"
    },
    "presets": {
      "basicRead": {
        "label": "Basic read",
        "description": "Чтение метаданных текущего API principal."
      },
      "organizationRead": {
        "label": "Organization read",
        "description": "Чтение записей организации, доступных ключу."
      },
      "organizationMembersRead": {
        "label": "Organization members read",
        "description": "Чтение списка участников организации."
      },
      "organizationTeamsRead": {
        "label": "Organization teams read",
        "description": "Чтение списка команд организации."
      },
      "organizationTeamMembersRead": {
        "label": "Organization team members read",
        "description": "Чтение участников команд."
      },
      "organizationReadAll": {
        "label": "Organization read all",
        "description": "Чтение организации, участников, команд и участников команд."
      }
    }
  }
}
```

Modify `src/i18n/messages.ts`:

```ts
import apiKeysEn from "@messages/features/api-keys.en.json";

export type I18nMessages = {
  common: typeof commonEn;
  accounts: typeof accountsEn;
  workspaces: typeof workspacesEn;
  apiKeys: typeof apiKeysEn;
  application: typeof applicationEn;
  dashboard: typeof dashboardEn;
};
```

Update `loadMessages`:

```ts
const [common, accounts, workspaces, apiKeys, application, dashboard] = await Promise.all([
  import(`../messages/common.${locale}.json`).then((module) => module.default),
  import(`../messages/features/accounts.${locale}.json`).then((module) => module.default),
  import(`../messages/features/workspaces.${locale}.json`).then((module) => module.default),
  import(`../messages/features/api-keys.${locale}.json`).then((module) => module.default),
  import(`../messages/features/application.${locale}.json`).then((module) => module.default),
  import(`../messages/features/dashboard.${locale}.json`).then((module) => module.default),
]);

return {
  common,
  accounts,
  workspaces,
  apiKeys,
  application,
  dashboard,
};
```

- [ ] **Step 6: Add page metadata messages**

Add to `src/messages/features/accounts.en.json` under `pages`:

```json
"api_keys": {
  "title": "API Keys",
  "description": "Manage personal API keys that act as your user account.",
  "openGraph": {
    "title": "API Keys",
    "description": "Create and manage personal API keys for external integrations."
  }
}
```

Add to `src/messages/features/workspaces.en.json` under `pages`:

```json
"settings_api_keys": {
  "title": "API Keys",
  "description": "Manage organization API keys for service integrations.",
  "openGraph": {
    "title": "API Keys",
    "description": "Create and manage organization API keys for service integrations."
  }
}
```

Add to `src/messages/features/accounts.ru.json` under `pages`:

```json
"api_keys": {
  "title": "API-ключи",
  "description": "Управляйте личными API-ключами, которые действуют как ваша учетная запись.",
  "openGraph": {
    "title": "API-ключи",
    "description": "Создавайте и управляйте личными API-ключами для внешних интеграций."
  }
}
```

Add to `src/messages/features/workspaces.ru.json` under `pages`:

```json
"settings_api_keys": {
  "title": "API-ключи",
  "description": "Управляйте API-ключами организации для сервисных интеграций.",
  "openGraph": {
    "title": "API-ключи",
    "description": "Создавайте и управляйте API-ключами организации для сервисных интеграций."
  }
}
```

- [ ] **Step 7: Add personal route page**

Create `src/app/(protected)/(global)/user/api-keys/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { ApiKeyManagementPage } from "@features/api-keys/components/api-key-management-page";
import { loadPersonalApiKeysPageData } from "@features/api-keys/api-keys-management";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.api_keys);

export default async function UserApiKeysPage() {
  const pageData = await loadPersonalApiKeysPageData();

  return (
    <SettingsPageSection mode="wide">
      <ApiKeyManagementPage pageData={pageData} showIntro />
    </SettingsPageSection>
  );
}
```

Create `src/app/(protected)/(global)/user/api-keys/opengraph-image.tsx`:

```tsx
import { buildPageMetadata, GlobalMetadata } from "@lib/metadata";
import routes from "@features/routes";
import { buildMetadataOGImage } from "@lib/metadata-og";

export const alt = GlobalMetadata.applicationName as string;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const page = routes.accounts.pages.api_keys;
const opengraphImage = async () =>
  buildMetadataOGImage(await buildPageMetadata(page), page.featureName);

export default opengraphImage;
```

Create `src/app/(protected)/(global)/user/api-keys/twitter-image.ts`:

```ts
export { alt, size, contentType, default } from "./opengraph-image";
```

- [ ] **Step 8: Add organization route page**

Create `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { WorkspaceSettingsRouteIntro } from "@features/workspaces/components/pages/workspace-settings-route-intro";
import { WorkspaceSettingsPlaceholderPageSkeleton } from "@features/workspaces/components/pages/workspace-settings-skeletons";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildPageMetadata } from "@lib/metadata";
import {
  WorkspaceSettingsApiKeysContent,
  type WorkspaceSettingsApiKeysPageProps,
} from "./workspace-settings-api-keys-content";

export const generateMetadata = async ({
  params,
}: WorkspaceSettingsApiKeysPageProps): Promise<Metadata> =>
  buildPageMetadata(workspaceRoutes.pages.settings_api_keys, await params);

export default function WorkspaceSettingsApiKeysRoutePage({
  params,
}: WorkspaceSettingsApiKeysPageProps) {
  return (
    <>
      <WorkspaceSettingsRouteIntro pageKey="settings_api_keys" />
      <Suspense
        fallback={
          <SettingsPageSection mode="wide">
            <WorkspaceSettingsPlaceholderPageSkeleton />
          </SettingsPageSection>
        }
      >
        <WorkspaceSettingsApiKeysContent params={params} />
      </Suspense>
    </>
  );
}
```

Create `workspace-settings-api-keys-content.tsx`:

```tsx
import { redirect } from "next/navigation";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { ApiKeyManagementPage } from "@features/api-keys/components/api-key-management-page";
import { loadOrganizationApiKeysPageData } from "@features/api-keys/api-keys-management";
import { loadWorkspaceSettingsApiKeysPageContext } from "@features/workspaces/workspaces-settings";
import workspaceRoutes from "@features/workspaces/workspaces-routes";

export interface WorkspaceSettingsApiKeysPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsApiKeysContent({
  params,
}: WorkspaceSettingsApiKeysPageProps) {
  const { organizationKey } = await params;
  const { workspace, canonicalOrganizationKey } =
    await loadWorkspaceSettingsApiKeysPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_api_keys.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  const pageData = await loadOrganizationApiKeysPageData({
    organizationId: workspace.id,
    organizationKey: canonicalOrganizationKey,
  });

  return (
    <SettingsPageSection mode="wide">
      <ApiKeyManagementPage pageData={pageData} showIntro={false} />
    </SettingsPageSection>
  );
}
```

Create `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/opengraph-image.tsx`:

```tsx
import { buildPageMetadata, GlobalMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildMetadataOGImage } from "@lib/metadata-og";

export const alt = GlobalMetadata.applicationName as string;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const page = workspaceRoutes.pages.settings_api_keys;
const opengraphImage = async ({ params }: { params: Promise<{ organizationKey: string }> }) =>
  buildMetadataOGImage(await buildPageMetadata(page, await params), page.featureName);

export default opengraphImage;
```

Create `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/twitter-image.ts`:

```ts
export { alt, size, contentType, default } from "./opengraph-image";
```

- [ ] **Step 9: Run route and type checks**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/management|api-keys/actions'
npm run lint
```

Expected:

```text
PASS test/features/api-keys/management/api-keys-schemas.test.ts
PASS test/features/api-keys/management/api-keys-management.test.ts
PASS test/features/api-keys/actions/create-api-key.test.ts
PASS test/features/api-keys/actions/manage-api-key.test.ts
```

`npm run lint` should exit 0. The existing TanStack Table React Compiler warning can remain if it is still present.

- [ ] **Step 10: Commit Task 3**

```bash
git add src/app src/features/accounts src/features/workspaces src/features/api-keys src/i18n src/messages
git commit -m "feat: add api key settings routes"
```

---

## Task 4: Shared API Key Management Components

**Files:**
- Create component files listed in File Structure.
- Create: `test/features/api-keys/components/api-key-management-page.test.tsx`

- [ ] **Step 1: Write component tests**

Create `test/features/api-keys/components/api-key-management-page.test.tsx`:

```tsx
/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (values?.count) return `${key} ${values.count}`;
    return key;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("@features/api-keys/actions/create-api-key", () => ({
  createApiKeyForCurrentUser: jest.fn(),
}));

jest.mock("@features/api-keys/actions/update-api-key", () => ({
  updateApiKeyForCurrentUser: jest.fn(),
}));

jest.mock("@features/api-keys/actions/delete-api-key", () => ({
  deleteApiKeyForCurrentUser: jest.fn(),
}));

import { ApiKeyManagementPage } from "@features/api-keys/components/api-key-management-page";
import type { ApiKeyManagementPageData } from "@features/api-keys/api-keys-types";

const pageData = {
  ownerType: "organization",
  organizationId: "org_1",
  organizationKey: "acme",
  keys: [
    {
      id: "key_1",
      configId: "org-keys",
      name: "Warehouse sync",
      start: "org_abcd",
      prefix: "org_",
      referenceId: "org_1",
      enabled: true,
      status: "active",
      permissions: {
        organization: ["read"],
        member: ["read"],
      },
      rateLimitEnabled: true,
      rateLimitTimeWindow: 86_400_000,
      rateLimitMax: 1000,
      requestCount: 12,
      remaining: null,
      lastRequest: new Date("2026-06-20T10:00:00.000Z"),
      expiresAt: null,
      createdAt: new Date("2026-06-10T10:00:00.000Z"),
      updatedAt: new Date("2026-06-11T10:00:00.000Z"),
    },
  ],
  capabilities: {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  },
} satisfies ApiKeyManagementPageData;

describe("ApiKeyManagementPage", () => {
  it("renders education copy, personal-key link, and key table rows", () => {
    render(<ApiKeyManagementPage pageData={pageData} showIntro={false} />);

    expect(screen.getByText("education.title")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "education.personalLink" })).toHaveAttribute(
      "href",
      "/user/api-keys"
    );
    expect(screen.getByText("Warehouse sync")).toBeInTheDocument();
    expect(screen.getByText("org_abcd")).toBeInTheDocument();
  });

  it("renders read-only notice when mutations are not allowed", () => {
    render(
      <ApiKeyManagementPage
        pageData={{
          ...pageData,
          capabilities: {
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          },
        }}
        showIntro={false}
      />
    );

    expect(screen.getByText("table.readOnlyNotice")).toBeInTheDocument();
  });

  it("renders empty state without keys", () => {
    render(
      <ApiKeyManagementPage
        pageData={{
          ...pageData,
          ownerType: "user",
          organizationId: undefined,
          organizationKey: undefined,
          keys: [],
        }}
        showIntro={false}
      />
    );

    expect(screen.getByText("table.emptyTitle")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "education.personalLink" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component test to verify it fails**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/components'
```

Expected:

```text
FAIL test/features/api-keys/components/api-key-management-page.test.tsx
```

The failure should mention missing `api-key-management-page`.

- [ ] **Step 3: Implement permissions preview**

Create `src/features/api-keys/components/api-key-permissions-preview.tsx`:

```tsx
"use client";

import { Badge } from "@components/ui/badge";
import type { ApiKeyPermissionRecord } from "@features/api-keys/api-keys-types";

interface ApiKeyPermissionsPreviewProps {
  permissions: ApiKeyPermissionRecord | null;
  emptyLabel: string;
}

export function ApiKeyPermissionsPreview({
  permissions,
  emptyLabel,
}: ApiKeyPermissionsPreviewProps) {
  const entries = Object.entries(permissions ?? {}).flatMap(([resource, actions]) =>
    (actions ?? []).map((action) => `${resource}:${action}`)
  );

  if (entries.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <Badge key={entry} variant="outline">
          {entry}
        </Badge>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Implement education section**

Create `src/features/api-keys/components/api-key-education-section.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Button } from "@components/ui/button";
import { SettingsSection } from "@components/application/settings/settings-shell";
import { IconKey, IconUser, IconBuilding, IconShieldCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import routes from "@features/routes";
import type { ApiKeyOwnerType } from "@features/api-keys/api-keys-types";

export function ApiKeyEducationSection({ ownerType }: { ownerType: ApiKeyOwnerType }) {
  const t = useTranslations("apiKeys.ui.education");

  return (
    <SettingsSection
      title={t("title")}
      description={t("description")}
      action={
        ownerType === "organization" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.accounts.pages.api_keys.path()}>
              <IconKey data-icon="inline-start" />
              {t("personalLink")}
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex min-w-0 gap-3">
          <IconUser aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-sm font-medium">{t("personalTitle")}</h3>
            <p className="text-muted-foreground text-sm">{t("personalDescription")}</p>
          </div>
        </div>
        <div className="flex min-w-0 gap-3">
          <IconBuilding aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-sm font-medium">{t("organizationTitle")}</h3>
            <p className="text-muted-foreground text-sm">{t("organizationDescription")}</p>
          </div>
        </div>
        <div className="flex min-w-0 gap-3">
          <IconShieldCheck aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-sm font-medium">{t("scopesTitle")}</h3>
            <p className="text-muted-foreground text-sm">{t("scopesDescription")}</p>
          </div>
        </div>
        <div className="flex min-w-0 gap-3">
          <IconKey aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-sm font-medium">{t("managementTitle")}</h3>
            <p className="text-muted-foreground text-sm">{t("managementDescription")}</p>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
```

- [ ] **Step 5: Implement table and row actions**

Create `src/features/api-keys/components/api-key-table.tsx` with:

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { IconDots, IconKey } from "@tabler/icons-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { timeTools } from "@lib/time";
import type {
  ApiKeyListItemDto,
  ApiKeyManagementCapabilities,
  ApiKeyOwnerType,
} from "@features/api-keys/api-keys-types";
import { ApiKeyPermissionsPreview } from "@features/api-keys/components/api-key-permissions-preview";
import { ApiKeyEditDialog } from "@features/api-keys/components/api-key-edit-dialog";
import { ApiKeyDeleteControl } from "@features/api-keys/components/api-key-delete-control";

interface ApiKeyTableProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  keys: ApiKeyListItemDto[];
  capabilities: ApiKeyManagementCapabilities;
}

const getStatusVariant = (status: ApiKeyListItemDto["status"]) =>
  status === "active" ? "secondary" : "outline";

export function ApiKeyTable({ ownerType, organizationId, keys, capabilities }: ApiKeyTableProps) {
  const t = useTranslations("apiKeys.ui.table");
  const locale = useLocale();
  const isReadOnly =
    ownerType === "organization" &&
    !capabilities.canCreate &&
    !capabilities.canUpdate &&
    !capabilities.canDelete;

  if (keys.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconKey />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isReadOnly ? <p className="text-muted-foreground text-sm">{t("readOnlyNotice")}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.key")}</TableHead>
            <TableHead>{t("columns.scopes")}</TableHead>
            <TableHead>{t("columns.rateLimit")}</TableHead>
            <TableHead>{t("columns.expires")}</TableHead>
            <TableHead>{t("columns.lastUsed")}</TableHead>
            <TableHead>{t("columns.created")}</TableHead>
            <TableHead className="w-12 text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell className="min-w-40">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{apiKey.name ?? apiKey.id}</span>
                  <Badge variant={getStatusVariant(apiKey.status)}>
                    {t(`status.${apiKey.status}`)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{apiKey.start ?? apiKey.prefix ?? apiKey.id}</TableCell>
              <TableCell>
                <ApiKeyPermissionsPreview permissions={apiKey.permissions} emptyLabel={t("emptyDescription")} />
              </TableCell>
              <TableCell>
                {apiKey.rateLimitEnabled && apiKey.rateLimitMax && apiKey.rateLimitTimeWindow
                  ? `${apiKey.rateLimitMax}/${apiKey.rateLimitTimeWindow}ms`
                  : t("unlimited")}
              </TableCell>
              <TableCell>
                {apiKey.expiresAt ? timeTools.formatDate(apiKey.expiresAt, locale) : t("never")}
              </TableCell>
              <TableCell>
                {apiKey.lastRequest ? timeTools.formatRelativeTime(apiKey.lastRequest, locale) : t("notUsed")}
              </TableCell>
              <TableCell>{timeTools.formatDate(apiKey.createdAt, locale)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <IconDots />
                      <span className="sr-only">{t("columns.actions")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      {capabilities.canUpdate ? (
                        <ApiKeyEditDialog
                          ownerType={ownerType}
                          organizationId={organizationId}
                          apiKey={apiKey}
                          trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>{t("actions.edit")}</DropdownMenuItem>}
                        />
                      ) : null}
                      {capabilities.canDelete ? (
                        <ApiKeyDeleteControl
                          ownerType={ownerType}
                          organizationId={organizationId}
                          apiKey={apiKey}
                          trigger={<DropdownMenuItem variant="destructive" onSelect={(event) => event.preventDefault()}>{t("actions.delete")}</DropdownMenuItem>}
                        />
                      ) : null}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

After adding the file, run `npm run lint`. Format any long imports and JSX props that Prettier reports.

- [ ] **Step 6: Implement create, edit, and delete dialogs**

Create the dialog files with these interfaces:

```ts
interface ApiKeyCreateDialogProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  trigger: React.ReactElement;
}

interface ApiKeyEditDialogProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  apiKey: ApiKeyListItemDto;
  trigger: React.ReactElement;
}

interface ApiKeyDeleteControlProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  apiKey: Pick<ApiKeyListItemDto, "id" | "name" | "start">;
  trigger: React.ReactElement;
}
```

Use these implementation rules in each file:

- Add `"use client"`.
- Use `Modal` for create and edit.
- Use `AlertDialog` for delete.
- Use `useForm` with `zodResolver`.
- Use `FieldGroup`, `Field`, `FieldLabel`, `Input`, `Select`, `Checkbox`, `Switch`, `FieldMessage`, `FormErrorNotice`, and `LoadingButton`.
- Use `apiKeyPermissionPresetOptions` to render preset checkboxes.
- Use `expandApiKeyPresetIds` to render the preview from selected presets.
- Call `router.refresh()` after success.
- Keep the created secret only in component state in `ApiKeyCreateDialog`.

The create submit body must be:

```ts
const result = await createApiKeyForCurrentUser({
  type: ownerType,
  organizationId,
  name: data.name,
  presetIds: data.presetIds,
  expiresIn: data.expiresIn,
  rateLimitEnabled: data.rateLimitEnabled,
  rateLimitMax: data.rateLimitMax,
  rateLimitWindow: data.rateLimitWindow,
});
```

The edit submit body must include only editable fields:

```ts
const result = await updateApiKeyForCurrentUser({
  type: ownerType,
  organizationId,
  keyId: apiKey.id,
  name: data.name,
  presetIds: data.presetIds,
  expiresIn: data.expiresIn,
  rateLimitEnabled: data.rateLimitEnabled,
  rateLimitMax: data.rateLimitMax,
  rateLimitWindow: data.rateLimitWindow,
  enabled: data.enabled,
});
```

The delete confirm body must be:

```ts
const result = await deleteApiKeyForCurrentUser({
  type: ownerType,
  organizationId,
  keyId: apiKey.id,
});
```

- [ ] **Step 7: Implement page composition**

Create `src/features/api-keys/components/api-key-management-page.tsx`:

```tsx
"use client";

import { Button } from "@components/ui/button";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { IconKey } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { ApiKeyCreateDialog } from "@features/api-keys/components/api-key-create-dialog";
import { ApiKeyEducationSection } from "@features/api-keys/components/api-key-education-section";
import { ApiKeyTable } from "@features/api-keys/components/api-key-table";
import type { ApiKeyManagementPageData } from "@features/api-keys/api-keys-types";

export function ApiKeyManagementPage({
  pageData,
  showIntro,
}: {
  pageData: ApiKeyManagementPageData;
  showIntro: boolean;
}) {
  const t = useTranslations("apiKeys.ui.table");
  const pageTitle =
    pageData.ownerType === "organization" ? t("title") : t("title");
  const pageDescription =
    pageData.ownerType === "organization"
      ? t("organizationDescription")
      : t("personalDescription");

  return (
    <>
      {showIntro ? <SettingsPageIntro title={pageTitle} description={pageDescription} /> : null}
      <ApiKeyEducationSection ownerType={pageData.ownerType} />
      <SettingsSection
        title={t("title")}
        description={pageDescription}
        action={
          pageData.capabilities.canCreate ? (
            <ApiKeyCreateDialog
              ownerType={pageData.ownerType}
              organizationId={pageData.organizationId}
              trigger={
                <Button size="sm" variant="outline">
                  <IconKey data-icon="inline-start" />
                  {t("createAction")}
                </Button>
              }
            />
          ) : null
        }
      >
        <ApiKeyTable
          ownerType={pageData.ownerType}
          organizationId={pageData.organizationId}
          keys={pageData.keys}
          capabilities={pageData.capabilities}
        />
      </SettingsSection>
    </>
  );
}
```

- [ ] **Step 8: Run component tests and lint**

Run:

```bash
npm run test -- --testPathPatterns='api-keys/components'
npm run lint
```

Expected:

```text
PASS test/features/api-keys/components/api-key-management-page.test.tsx
```

`npm run lint` should exit 0, with only pre-existing warnings accepted.

- [ ] **Step 9: Commit Task 4**

```bash
git add src/features/api-keys/components test/features/api-keys/components
git commit -m "feat: add api key management components"
```

---

## Task 5: Full Verification and Polish

**Files:**
- Modify only files touched by Tasks 1-4 for fixes found by verification.

- [ ] **Step 1: Run focused API key tests**

Run:

```bash
npm run test -- --testPathPatterns=api-keys
```

Expected:

```text
PASS test/features/api-keys/permissions/api-keys-permissions.test.ts
PASS test/features/api-keys/actions/create-api-key.test.ts
PASS test/features/api-keys/actions/manage-api-key.test.ts
PASS test/features/api-keys/auth/api-keys-auth.test.ts
PASS test/features/api-keys/auth/api-keys-organization-access.test.ts
PASS test/features/api-keys/routes/api-v1-route-config.test.ts
PASS test/features/api-keys/routes/api-v1-route-handlers.test.ts
PASS test/features/api-keys/management/api-keys-schemas.test.ts
PASS test/features/api-keys/management/api-keys-management.test.ts
PASS test/features/api-keys/components/api-key-management-page.test.tsx
```

- [ ] **Step 2: Run full Jest suite**

Run:

```bash
npm run test
```

Expected:

```text
Test Suites: all passing
Tests: all passing
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected:

```text
exit code 0
```

The known TanStack Table React Compiler warning in `src/features/dashboard/ui/template/data-table.tsx` can remain when it is still reported.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected:

```text
✓ Compiled successfully
```

The build output should include `/user/api-keys` and `/w/[organizationKey]/settings/api-keys` as protected App Router pages.

- [ ] **Step 5: Run diff whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 6: Commit verification fixes**

If verification required code changes, commit them:

```bash
git add src test
git commit -m "fix: polish api key management ui"
```

If verification required no code changes, do not create an empty commit.
