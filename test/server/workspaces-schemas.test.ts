import {
  WORKSPACE_NAME_MAX_LENGTH,
  createUpdateWorkspaceFormSchema,
} from "@features/workspaces/workspaces-schemas";

describe("workspace form schemas", () => {
  it("uses the provided translator for update form validation messages", () => {
    const tAny = (key: string, options?: object) =>
      `translated:${key}:${JSON.stringify(options ?? {})}`;
    const schema = createUpdateWorkspaceFormSchema("Current", tAny);

    const requiredResult = schema.safeParse({
      id: "d6qzollaqro6y66v7j52bhqo",
      name: "   ",
      isDefault: false,
    });
    const tooLongResult = schema.safeParse({
      id: "d6qzollaqro6y66v7j52bhqo",
      name: "a".repeat(WORKSPACE_NAME_MAX_LENGTH + 1),
      isDefault: false,
    });

    expect(requiredResult.success).toBe(false);
    expect(requiredResult.error?.issues[0]?.message).toBe(
      "translated:validation.errors.nameRequired:{}"
    );

    expect(tooLongResult.success).toBe(false);
    expect(tooLongResult.error?.issues[0]?.message).toBe(
      `translated:validation.errors.nameTooLong:{"max":${WORKSPACE_NAME_MAX_LENGTH}}`
    );
  });

  it("uses the provided translator for slug validation messages too", () => {
    const tAny = (key: string, options?: object) =>
      `translated:${key}:${JSON.stringify(options ?? {})}`;
    const schema = createUpdateWorkspaceFormSchema("Current", tAny);

    const result = schema.safeParse({
      id: "d6qzollaqro6y66v7j52bhqo",
      name: "Current updated",
      slug: "invalid slug",
      isDefault: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "translated:validation.errors.nameInvalidCharacters:{}"
    );
  });

  it("accepts better-auth organization ids in update form schema", () => {
    const tAny = (key: string) => `translated:${key}`;
    const schema = createUpdateWorkspaceFormSchema("Current", tAny);

    const result = schema.safeParse({
      id: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
      name: "Current updated",
      slug: "current-updated",
      isDefault: false,
    });

    expect(result.success).toBe(true);
  });
});
