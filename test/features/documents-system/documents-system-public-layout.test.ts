/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";

const readSource = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("documents-system public layout", () => {
  it("keeps server HTML independent of the sidebar cookie", () => {
    const layoutSource = readSource("src", "app", "(public)", "(documents-system)", "layout.tsx");
    const genericSidebarSource = readSource("src", "components", "ui", "sidebar.tsx");

    expect(layoutSource).toContain("DocumentsSystemSidebarProvider");
    expect(layoutSource).not.toContain("getTFromCookie");
    expect(layoutSource).not.toContain("SIDEBAR_COOKIE_KEY");
    expect(layoutSource).not.toMatch(/from ["']next\/headers["']/u);
    expect(layoutSource).not.toMatch(/\bcookies\s*\(/u);
    expect(genericSidebarSource).not.toContain("parseDocumentsSidebarCookie");
  });
});
