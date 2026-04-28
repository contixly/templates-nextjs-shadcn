import "server-only";
import { createCacheHandler } from "@mrjasonroy/cache-components-cache-handler";
import { REMOTE_CACHING_ENABLED } from "@lib/environment";

const cacheHandler = REMOTE_CACHING_ENABLED
  ? createCacheHandler({ type: "redis" })
  : createCacheHandler({ type: "memory" });

export default cacheHandler;
