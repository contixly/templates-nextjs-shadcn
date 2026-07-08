jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

jest.mock("@lib/environment", () => ({
  APP_BASE_URL: "http://localhost:3000",
}));

import sitemap from "@/src/app/sitemap";

describe("application sitemap", () => {
  it("includes visible documentation pages from the documents registry", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("http://localhost:3000/docs");
    expect(urls).toContain("http://localhost:3000/docs/general/glossary");
    expect(urls).toContain("http://localhost:3000/docs/history/releases/0.0.10");
    expect(urls.filter((url) => url === "http://localhost:3000/docs")).toHaveLength(1);
    expect(urls.some((url) => /\.(en|ru)(?:\/|$)/u.test(url))).toBe(false);
  });
});
