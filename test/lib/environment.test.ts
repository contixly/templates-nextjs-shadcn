/** @jest-environment node */

jest.mock("better-auth", () => ({
  isProduction: false,
}));

describe("environment", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_YM_COUNTER_ID;
    delete process.env.YM_COUNTER_ID;
    jest.resetModules();
  });

  it("reads YM counter id from NEXT_PUBLIC_YM_COUNTER_ID for client-safe access", async () => {
    process.env.NEXT_PUBLIC_YM_COUNTER_ID = "123456";
    process.env.YM_COUNTER_ID = "654321";

    const environmentModule = await import("../../src/lib/environment");

    expect(environmentModule.YM_COUNTER_ID).toBe("123456");
  });
});
