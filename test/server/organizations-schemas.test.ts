import { organizationIdSchema } from "../../src/features/organizations/organizations-schemas";

describe("organizationIdSchema", () => {
  it("accepts Better Auth mixed-case organization ids", () => {
    expect(organizationIdSchema.safeParse("RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H").success).toBe(true);
    expect(organizationIdSchema.safeParse("A4BKAvzeU8jgG6ceGwV9edysQ0ZWgOlm").success).toBe(true);
  });

  it("rejects organization ids with non-alphanumeric characters", () => {
    expect(organizationIdSchema.safeParse("org_invalid-value").success).toBe(false);
    expect(organizationIdSchema.safeParse("org invalid").success).toBe(false);
  });
});
