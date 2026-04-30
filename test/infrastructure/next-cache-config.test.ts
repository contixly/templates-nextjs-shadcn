/** @jest-environment node */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type CacheSettingsModule = {
  assertRemoteCacheConfiguration: () => void;
  getRedisConnectionUrl: () => string | undefined;
};

const remoteCacheEnvKeys = [
  "REMOTE_CACHING_ENABLED",
  "REMOTE_CACHING_PREFIX",
  "REDIS_URL",
  "VALKEY_URL",
  "REDIS_PASSWORD",
] as const;

type RemoteCacheEnvKey = (typeof remoteCacheEnvKeys)[number];

const withRemoteCacheEnv = async <T>(
  cacheSettingsPath: string,
  env: Partial<Record<RemoteCacheEnvKey, string>>,
  callback: (settings: CacheSettingsModule) => T | Promise<T>
) => {
  const previousEnv = new Map(remoteCacheEnvKeys.map((key) => [key, process.env[key]] as const));

  for (const key of remoteCacheEnvKeys) {
    delete process.env[key];
  }

  Object.assign(process.env, env);
  jest.resetModules();

  try {
    const settings = (await import(
      `${pathToFileURL(cacheSettingsPath).href}?case=${Date.now()}-${Math.random()}`
    )) as CacheSettingsModule;

    return await callback(settings);
  } finally {
    for (const [key, value] of previousEnv) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    jest.resetModules();
  }
};

describe("Next cache configuration", () => {
  const rootDir = process.cwd();
  const cacheDir = path.join(rootDir, "src/server/cache");
  const dataCacheHandlerPath = path.join(cacheDir, "cache.mjs");
  const isrCacheHandlerPath = path.join(cacheDir, "isr-cache.mjs");
  const cacheSettingsPath = path.join(cacheDir, "settings.mjs");

  test("configures a distributed ISR cache handler alongside Cache Components handlers", async () => {
    const nextConfigSource = await fs.readFile(path.join(rootDir, "next.config.ts"), "utf8");

    expect(nextConfigSource).toContain("./src/server/cache/cache.mjs");
    expect(nextConfigSource).toContain("./src/server/cache/isr-cache.mjs");
    expect(nextConfigSource).toMatch(/cacheHandler:\s*isrCacheHandlerPath/);
    expect(nextConfigSource).toMatch(/default:\s*dataCacheHandlerPath/);
    expect(nextConfigSource).toMatch(/remote:\s*dataCacheHandlerPath/);
    await expect(fs.access(isrCacheHandlerPath)).resolves.toBeUndefined();

    const isrCacheHandlerSource = await fs.readFile(isrCacheHandlerPath, "utf8");
    expect(isrCacheHandlerSource).toContain("RedisCacheHandler");
    expect(isrCacheHandlerSource).toContain("MemoryCacheHandler");
    expect(isrCacheHandlerSource).toContain("Array.isArray(tags)");
  });

  test("shares remote cache environment parsing between data and ISR handlers", async () => {
    await expect(fs.access(cacheSettingsPath)).resolves.toBeUndefined();

    const dataCacheHandlerSource = await fs.readFile(dataCacheHandlerPath, "utf8");
    const isrCacheHandlerSource = await fs.readFile(isrCacheHandlerPath, "utf8");

    expect(dataCacheHandlerSource).toContain("./settings.mjs");
    expect(isrCacheHandlerSource).toContain("./settings.mjs");
    expect(dataCacheHandlerSource).not.toContain("process.env.REMOTE_CACHING_ENABLED");
    expect(isrCacheHandlerSource).not.toContain("process.env.REMOTE_CACHING_ENABLED");
  });

  test("rejects whitespace-only remote cache URLs when remote caching is enabled", async () => {
    await withRemoteCacheEnv(
      cacheSettingsPath,
      {
        REMOTE_CACHING_ENABLED: "true",
        REDIS_URL: " \n\t ",
      },
      ({ assertRemoteCacheConfiguration, getRedisConnectionUrl }) => {
        expect(() => assertRemoteCacheConfiguration()).toThrow(
          "REDIS_URL or VALKEY_URL must be configured when REMOTE_CACHING_ENABLED is true."
        );
        expect(getRedisConnectionUrl()).toBeUndefined();
      }
    );
  });

  test("keeps cache handlers grouped under src/server/cache", async () => {
    await expect(fs.access(path.join(rootDir, "src/server/cache.mjs"))).rejects.toThrow();
    await expect(fs.access(path.join(rootDir, "src/server/isr-cache.mjs"))).rejects.toThrow();
    await expect(fs.access(path.join(rootDir, "src/server/cache-settings.mjs"))).rejects.toThrow();
  });
});
