export const remoteCachingEnabled = ["1", "true", "yes"].includes(
  String(process.env.REMOTE_CACHING_ENABLED ?? "").toLowerCase()
);

export const remoteCachingPrefix = String(process.env.REMOTE_CACHING_PREFIX ?? "myapp");

const redisUrl = process.env.REDIS_URL ?? process.env.VALKEY_URL;

export const assertRemoteCacheConfiguration = () => {
  if (remoteCachingEnabled && !redisUrl) {
    throw new Error(
      "REDIS_URL or VALKEY_URL must be configured when REMOTE_CACHING_ENABLED is true."
    );
  }
};

export const getRedisConnectionUrl = () => {
  if (!redisUrl) return undefined;
  if (!process.env.REDIS_PASSWORD) return redisUrl;

  try {
    const url = new URL(redisUrl);
    if (!url.password) {
      url.password = process.env.REDIS_PASSWORD;
    }
    return url.toString();
  } catch {
    return redisUrl;
  }
};

export const getCachePrefixes = ({ keySegment, tagSegment }) => ({
  keyPrefix: `${remoteCachingPrefix}:${keySegment}:`,
  tagPrefix: `${remoteCachingPrefix}:${tagSegment}:`,
});
