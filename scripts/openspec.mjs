import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(resolve(root, "package.json"));
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const requiredVersion = packageJson.devDependencies?.["@fission-ai/openspec"];

if (!requiredVersion || !/^\d+\.\d+\.\d+$/.test(requiredVersion)) {
  console.error("OpenSpec must be pinned to an exact version in devDependencies.");
  process.exit(1);
}

const packageRoot = resolve(dirname(require.resolve("@fission-ai/openspec")), "..");
const cli = resolve(packageRoot, "bin", "openspec.js");
const installedPackage = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));

if (installedPackage.version !== requiredVersion) {
  console.error(
    `OpenSpec version mismatch: package.json requires ${requiredVersion}, but node_modules has ${installedPackage.version}. Run npm ci.`
  );
  process.exit(1);
}

const version = spawnSync(process.execPath, [cli, "--version"], { encoding: "utf8" });
if (version.error || version.status !== 0 || version.stdout.trim() !== requiredVersion) {
  console.error(
    `OpenSpec CLI version mismatch: expected ${requiredVersion}, got ${version.stdout.trim() || version.stderr.trim() || "unavailable"}. Run npm ci.`
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
