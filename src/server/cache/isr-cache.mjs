import { MemoryCacheHandler, RedisCacheHandler } from "@mrjasonroy/cache-components-cache-handler";
import {
  assertRemoteCacheConfiguration,
  getCachePrefixes,
  getRedisConnectionUrl,
  remoteCachingEnabled,
} from "./settings.mjs";

assertRemoteCacheConfiguration();

const isrCachePrefixes = getCachePrefixes({ keySegment: "isr", tagSegment: "isr-tags" });

const toTagList = (tags) => {
  const tagList = Array.isArray(tags) ? tags : [tags];

  return tagList.filter(Boolean);
};

class LocalIncrementalCacheHandler extends MemoryCacheHandler {
  async revalidateTag(tags, profile) {
    await Promise.all(toTagList(tags).map((tag) => super.revalidateTag(tag, profile)));
  }
}

class DistributedIncrementalCacheHandler extends RedisCacheHandler {
  constructor(options) {
    super({
      ...options,
      redis: getRedisConnectionUrl(),
      ...isrCachePrefixes,
    });
  }

  async revalidateTag(tags, profile) {
    await Promise.all(toTagList(tags).map((tag) => super.revalidateTag(tag, profile)));
  }
}

export default remoteCachingEnabled
  ? DistributedIncrementalCacheHandler
  : LocalIncrementalCacheHandler;
