/** @jest-environment node */

import {
  API_KEY_EXPIRATION_OPTIONS,
  API_KEY_RATE_LIMIT_WINDOW_OPTIONS,
  apiKeyDeleteSchema,
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
      organizationId: "org1",
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

  it("rejects personal key creation with an organization id", () => {
    const parsed = apiKeyCreateFormSchema.safeParse({
      type: "user",
      organizationId: "org1",
      name: "Personal key",
      presetIds: ["basic-read"],
      expiresIn: "7d",
      rateLimitEnabled: true,
      rateLimitMax: 100,
      rateLimitWindow: "1h",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("api_keys.invalid_request");
  });

  it("rejects personal key updates with an organization id", () => {
    const parsed = apiKeyUpdateFormSchema.safeParse({
      type: "user",
      keyId: "key1",
      organizationId: "org1",
      name: "Personal key",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("api_keys.invalid_request");
  });

  it("rejects personal key deletion with an organization id", () => {
    const parsed = apiKeyDeleteSchema.safeParse({
      type: "user",
      keyId: "key1",
      organizationId: "org1",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("api_keys.invalid_request");
  });

  it("rejects ids outside the repository id validators", () => {
    expect(
      apiKeyCreateFormSchema.safeParse({
        type: "organization",
        organizationId: "org_1",
        name: "Underscore org",
        presetIds: ["basic-read"],
        expiresIn: "7d",
        rateLimitEnabled: true,
        rateLimitMax: 100,
        rateLimitWindow: "1h",
      }).success
    ).toBe(false);

    expect(
      apiKeyUpdateFormSchema.safeParse({
        type: "user",
        keyId: "key_1",
        name: "Underscore key",
      }).success
    ).toBe(false);
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
      keyId: "key1",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("api_keys.no_update_values");
  });
});
