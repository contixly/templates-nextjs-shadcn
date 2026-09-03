import "server-only";

import prisma from "@server/prisma";
import { remoteCachingEnabled } from "@server/cache/settings.mjs";
import { sharedCacheRedis } from "@server/cache/shared-redis.mjs";

type ReadinessDependencies = Readonly<{
  checkDatabase: () => Promise<unknown>;
  checkSharedCache: () => Promise<unknown>;
}>;

const readinessDependencies: ReadinessDependencies = {
  checkDatabase: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
  checkSharedCache: async () => {
    if (!remoteCachingEnabled) return;

    const redis = sharedCacheRedis();
    if (!redis) throw new Error("shared_cache_not_configured");
    await redis.ping();
  },
};

export async function checkApplicationReadiness(
  dependencies: ReadinessDependencies = readinessDependencies
): Promise<void> {
  await dependencies.checkDatabase();
  await dependencies.checkSharedCache();
}
