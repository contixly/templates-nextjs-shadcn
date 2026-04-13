/** @jest-environment node */
describe("prisma.config", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
      return;
    }

    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  test("loads without DATABASE_URL by using template fallback", async () => {
    delete process.env.DATABASE_URL;

    await expect(import("../../prisma.config")).resolves.toBeDefined();
  });
});
