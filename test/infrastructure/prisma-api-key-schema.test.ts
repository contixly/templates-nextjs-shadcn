/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";

const schema = () => fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
const migrations = () => {
  const migrationsDir = path.join(process.cwd(), "prisma/migrations");

  return fs
    .readdirSync(migrationsDir)
    .filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory())
    .map((entry) => fs.readFileSync(path.join(migrationsDir, entry, "migration.sql"), "utf8"))
    .join("\n");
};

describe("Prisma API key schema", () => {
  it("defines the Better Auth API key table mapping", () => {
    expect(schema()).toContain("model ApiKey");
    expect(schema()).toContain('@@map("apikey")');
    expect(schema()).toContain("configId");
    expect(schema()).toContain("referenceId");
    expect(schema()).toContain("permissions");
  });

  it("includes a migration for the Better Auth API key table", () => {
    const migrationSql = migrations();

    expect(migrationSql).toContain('CREATE TABLE "apikey"');
    expect(migrationSql).toContain("\"configId\" TEXT NOT NULL DEFAULT 'default'");
    expect(migrationSql).toContain('"referenceId" TEXT NOT NULL');
    expect(migrationSql).toContain('"permissions" TEXT');
    expect(migrationSql).toContain('CREATE INDEX "apikey_configId_idx" ON "apikey"("configId")');
    expect(migrationSql).toContain(
      'CREATE INDEX "apikey_referenceId_idx" ON "apikey"("referenceId")'
    );
    expect(migrationSql).toContain('CREATE INDEX "apikey_key_idx" ON "apikey"("key")');
  });
});
