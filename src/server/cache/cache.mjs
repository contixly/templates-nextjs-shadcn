import { createCacheHandler } from "@mrjasonroy/cache-components-cache-handler";
import {
  assertRemoteCacheConfiguration,
  getCachePrefixes,
  remoteCachingEnabled,
} from "./settings.mjs";

assertRemoteCacheConfiguration();

// See https://github.com/mrjasonroy/cache-components-cache-handler/blob/main/docs/installation.md for other options
const cacheHandler = createCacheHandler({
  type: remoteCachingEnabled ? "redis" : "memory",
  ...getCachePrefixes({ keySegment: "cache", tagSegment: "tags" }),
});

export default cacheHandler;
