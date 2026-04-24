/** @jest-environment node */

import { sanitizeRedirectPath } from "@lib/routes";

describe("sanitizeRedirectPath", () => {
  it("keeps valid in-app relative paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/settings/profile?tab=general")).toBe(
      "/settings/profile?tab=general"
    );
  });

  it("rejects protocol-relative paths", () => {
    expect(sanitizeRedirectPath("//evil.example")).toBe("/");
  });

  it("rejects paths that become protocol-relative after normalization", () => {
    expect(sanitizeRedirectPath("/..//evil.example")).toBe("/");
  });

  it("rejects paths with backslashes that can become protocol-relative", () => {
    expect(sanitizeRedirectPath("/\\evil.example")).toBe("/");
  });

  it("rejects protocol-relative paths after stripping an absolute url origin", () => {
    expect(sanitizeRedirectPath("https://evil.example//evil.example")).toBe("/");
  });
});
