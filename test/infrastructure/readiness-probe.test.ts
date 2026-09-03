/** @jest-environment node */

const mockQueryRaw = jest.fn();
const mockPing = jest.fn();

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: { $queryRaw: (...args: unknown[]) => mockQueryRaw(...args) },
}));
jest.mock("@server/cache/settings.mjs", () => ({ remoteCachingEnabled: true }));
jest.mock("@server/cache/shared-redis.mjs", () => ({
  sharedCacheRedis: () => ({ ping: () => mockPing() }),
}));

import { checkApplicationReadiness } from "@server/readiness";

describe("application readiness probe", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset().mockResolvedValue([{ result: 1 }]);
    mockPing.mockReset().mockResolvedValue("PONG");
  });

  test("uses PostgreSQL and the configured shared cache by default", async () => {
    await expect(checkApplicationReadiness()).resolves.toBeUndefined();

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  test("checks the database and shared cache", async () => {
    const checkDatabase = jest.fn().mockResolvedValue(undefined);
    const checkSharedCache = jest.fn().mockResolvedValue(undefined);

    await expect(
      checkApplicationReadiness({ checkDatabase, checkSharedCache })
    ).resolves.toBeUndefined();

    expect(checkDatabase).toHaveBeenCalledTimes(1);
    expect(checkSharedCache).toHaveBeenCalledTimes(1);
  });

  test("fails when either required dependency is unavailable", async () => {
    await expect(
      checkApplicationReadiness({
        checkDatabase: jest.fn().mockRejectedValue(new Error("database unavailable")),
        checkSharedCache: jest.fn().mockResolvedValue(undefined),
      })
    ).rejects.toThrow("database unavailable");

    await expect(
      checkApplicationReadiness({
        checkDatabase: jest.fn().mockResolvedValue(undefined),
        checkSharedCache: jest.fn().mockRejectedValue(new Error("cache unavailable")),
      })
    ).rejects.toThrow("cache unavailable");
  });
});
