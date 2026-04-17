import {
  WORKSPACE_NAME_MAX_LENGTH,
  createUpdateWorkspaceFormSchema,
} from "../../src/features/workspaces/workspaces-schemas";

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
    expect(requiredResult.error.issues[0]?.message).toBe(
      "translated:validation.errors.nameRequired:{}"
    );

    expect(tooLongResult.success).toBe(false);
    expect(tooLongResult.error.issues[0]?.message).toBe(
      `translated:validation.errors.nameTooLong:{"max":${WORKSPACE_NAME_MAX_LENGTH}}`
    );
  });
});
