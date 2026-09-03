/** @jest-environment node */

import { existsSync, readFileSync } from "node:fs";

const composePath = "infra/dokploy/compose.yml";
const exampleEnvPath = "infra/dokploy/compose.env.example";

function readRequiredFile(path: string): string {
  expect(existsSync(path)).toBe(true);
  return readFileSync(path, "utf8");
}

const requiredKeys = [
  "DATABASE_URL",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_BASE_URL",
  "NEXT_PUBLIC_YM_COUNTER_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITLAB_CLIENT_ID",
  "GITLAB_CLIENT_SECRET",
  "VK_CLIENT_ID",
  "YANDEX_CLIENT_ID",
  "YANDEX_CLIENT_SECRET",
  "REDIS_URL",
  "VALKEY_URL",
  "REDIS_PASSWORD",
  "REMOTE_CACHING_ENABLED",
  "REMOTE_CACHING_PREFIX",
  "PUBLIC_DEFAULT_LOCALE",
  "NEXT_DEPLOYMENT_ID",
] as const;

test("defines only the two-replica edge and web topology on the external Dokploy network", () => {
  const compose = readRequiredFile(composePath);

  expect(compose).toMatch(/^name:\s*nextjs-shadcn$/mu);
  expect(compose).toMatch(/edge:[\s\S]*?replicas:\s*2/u);
  expect(compose).toMatch(/web:[\s\S]*?replicas:\s*2/u);
  expect(compose).toContain("dockerfile: Dockerfile");
  expect(compose).toContain("dockerfile: infra/dokploy/nginx/Dockerfile");
  expect(compose).toContain("http://127.0.0.1:3000/api/health");
  expect(compose).toContain("http://127.0.0.1:8080/nginx-health");
  expect(compose).toContain("wget -qO- http://127.0.0.1:8080/nginx-health | grep -qx ok");
  expect(compose).not.toContain("grep --quiet");
  expect(compose).not.toMatch(/^\s{2}(postgres|dragonfly|redis|valkey):/mu);
  expect(compose).not.toMatch(/\/var\/cache\/nginx\/public:/u);
  expect(compose).not.toMatch(/^\s{4}ports:/mu);
  expect(compose).toMatch(/edge:[\s\S]*?expose:\s*\n\s*- "8080"/u);
  expect(compose).toMatch(/web:[\s\S]*?expose:\s*\n\s*- "3000"/u);
  expect(compose).toMatch(
    /dokploy-network:\s*\n\s*external:\s*true\s*\n\s*name:\s*dokploy-network/u
  );
});

test("maps build arguments, BuildKit secrets, runtime settings, and safe defaults", () => {
  const compose = readRequiredFile(composePath);

  for (const key of requiredKeys) {
    expect(compose).toContain(`${key}: \${${key}`);
  }

  for (const secret of [
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
    "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ]) {
    expect(compose).toMatch(new RegExp(`build:[\\s\\S]*?secrets:[\\s\\S]*?- ${secret}`));
    expect(compose).toContain(`environment: ${secret}`);
  }

  expect(compose).toContain("NEXT_PUBLIC_APP_BASE_URL: ${NEXT_PUBLIC_APP_BASE_URL:?");
  expect(compose).toContain("REMOTE_CACHING_ENABLED: ${REMOTE_CACHING_ENABLED:-false}");
  expect(compose).toContain("REMOTE_CACHING_PREFIX: ${REMOTE_CACHING_PREFIX:-myapp}");
  expect(compose).toContain("PUBLIC_DEFAULT_LOCALE: ${PUBLIC_DEFAULT_LOCALE:-en}");
  expect(compose).not.toMatch(/https?:\/\/(?!127\.0\.0\.1|web:)/u);
  expect(compose).not.toMatch(/(password|secret)=([^$\s][^\s]*)/iu);
});

test("provides one safe example value for every Compose interpolation key", () => {
  const compose = readRequiredFile(composePath);
  const exampleEnv = readRequiredFile(exampleEnvPath);
  const interpolationKeys = [
    ...new Set([...compose.matchAll(/\$\{([A-Z][A-Z0-9_]*)/gu)].map((match) => match[1])),
  ].sort();
  const exampleEntries = [...exampleEnv.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gmu)];
  const exampleKeys = exampleEntries.map((entry) => entry[1]).sort();

  expect(exampleKeys).toEqual(interpolationKeys);
  expect(new Set(exampleKeys).size).toBe(exampleKeys.length);
  expect(exampleEnv).toContain("NEXT_PUBLIC_APP_BASE_URL=https://example.com");
  expect(exampleEnv).toMatch(/^DATABASE_URL=.*database\.invalid/mu);
  expect(exampleEnv).toContain("replace-with-a-secret");
  expect(exampleEnv).not.toMatch(/localhost|127\.0\.0\.1/u);
});
