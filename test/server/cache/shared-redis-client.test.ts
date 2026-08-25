/** @jest-environment node */

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const repositoryRoot = resolve(__dirname, "../../../");

test("reuses one cache Redis client across independently evaluated cache-handler modules", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `
        try {
          const firstModule = await import("./src/server/cache/shared-redis.mjs?first");
          const secondModule = await import("./src/server/cache/shared-redis.mjs?second");
          let creations = 0;
          const createClient = () => ({ id: ++creations });
          const first = firstModule.getOrCreateSharedCacheRedis(
            "redis://cache.test:6379",
            createClient
          );
          const second = secondModule.getOrCreateSharedCacheRedis(
            "redis://cache.test:6379",
            createClient
          );
          console.log(JSON.stringify({ same: first === second, creations }));
        } catch (error) {
          console.log(JSON.stringify({ same: false, creations: 0, error: error.code }));
        }
      `,
    ],
    { cwd: repositoryRoot, encoding: "utf8" }
  );

  expect(JSON.parse(output)).toEqual({ same: true, creations: 1 });
});
