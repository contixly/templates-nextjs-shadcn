import {
  createIoredisAdapter,
  createMemoryDataCacheHandler,
  createRedisDataCacheHandler,
} from "@mrjasonroy/cache-components-cache-handler";
import {
  assertRemoteCacheConfiguration,
  getCachePrefixes,
  remoteCachingEnabled,
} from "./settings.mjs";
import { sharedCacheRedis } from "./shared-redis.mjs";

assertRemoteCacheConfiguration();

const redis = sharedCacheRedis();
const cachePrefixes = getCachePrefixes({ keySegment: "cache", tagSegment: "tags" });

const cacheHandler = remoteCachingEnabled
  ? createRedisDataCacheHandler({
      redis: createIoredisAdapter(redis),
      ...cachePrefixes,
    })
  : createMemoryDataCacheHandler({ maxSize: 100 * 1024 * 1024 });

export default cacheHandler;
