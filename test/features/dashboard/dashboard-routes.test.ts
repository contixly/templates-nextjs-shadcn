import fs from "node:fs";
import path from "node:path";

describe("dashboard route module naming", () => {
  test("uses canonical dashboard-routes.ts filename", () => {
    const canonicalPath = path.join(process.cwd(), "src/features/dashboard/dashboard-routes.ts");
    const typoPath = path.join(process.cwd(), "src/features/dashboard/dashoard-routes.ts");

    expect(fs.existsSync(canonicalPath)).toBe(true);
    expect(fs.existsSync(typoPath)).toBe(false);
  });
});
