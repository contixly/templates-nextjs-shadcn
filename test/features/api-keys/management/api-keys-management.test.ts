/** @jest-environment node */

import { getApiKeyStatus, toApiKeyListItemDto } from "@features/api-keys/api-keys-management";

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
