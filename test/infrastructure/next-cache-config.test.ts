/** @jest-environment node */
import fs from "node:fs/promises";
import path from "node:path";

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

  test("keeps cache handlers grouped under src/server/cache", async () => {
    await expect(fs.access(path.join(rootDir, "src/server/cache.mjs"))).rejects.toThrow();
    await expect(fs.access(path.join(rootDir, "src/server/isr-cache.mjs"))).rejects.toThrow();
    await expect(fs.access(path.join(rootDir, "src/server/cache-settings.mjs"))).rejects.toThrow();
  });
});
