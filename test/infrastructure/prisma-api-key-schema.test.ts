/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";

const schema = () => fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");

describe("Prisma API key schema", () => {
  it("defines the Better Auth API key table mapping", () => {
    expect(schema()).toContain("model ApiKey");
    expect(schema()).toContain('@@map("apikey")');
    expect(schema()).toContain("configId");
    expect(schema()).toContain("referenceId");
    expect(schema()).toContain("permissions");
  });
});
