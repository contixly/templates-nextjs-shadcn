import Redis from "ioredis";

import {
  assertRemoteCacheConfiguration,
  getRedisConnectionUrl,
  remoteCachingEnabled,
} from "./settings.mjs";

const sharedRedisKey = Symbol.for("nextjs-shadcn.cache.redis");

/** Reuse one Redis connection when Next.js evaluates cache-handler modules independently. */
export function getOrCreateSharedCacheRedis(url, createClient = (value) => new Redis(value)) {
  const existing = globalThis[sharedRedisKey];

  if (existing) {
    if (existing.url !== url) throw new Error("cache_redis_url_changed");
    return existing.client;
  }

  const client = createClient(url);
  client.on?.("error", (error) => {
    console.error("[CacheRedis] connection error", error);
  });
  globalThis[sharedRedisKey] = { client, url };

  return client;
}

export function sharedCacheRedis() {
  if (!remoteCachingEnabled) return undefined;

  assertRemoteCacheConfiguration();
  return getOrCreateSharedCacheRedis(getRedisConnectionUrl());
}
