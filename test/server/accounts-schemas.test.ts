import {
  createDeleteAccountFormSchema,
  createUpdateProfileFormSchema,
} from "@features/accounts/accounts-schemas";

describe("account form schemas", () => {
  it("uses the provided translator for profile form validation messages", () => {
    const tAny = (key: string, options?: object) =>
      `translated:${key}:${JSON.stringify(options ?? {})}`;
    const schema = createUpdateProfileFormSchema("Current", tAny);

    const requiredResult = schema.safeParse({
      name: " ",
    });
    const tooLongResult = schema.safeParse({
      name: "a".repeat(51),
    });

    expect(requiredResult.success).toBe(false);
    expect(requiredResult.error?.issues[0]?.message).toBe(
      'translated:validation.errors.profileNameTooShort:{"min":2}'
    );

    expect(tooLongResult.success).toBe(false);
    expect(tooLongResult.error?.issues[0]?.message).toBe(
      'translated:validation.errors.profileNameTooLong:{"max":50}'
    );
  });

  it("uses the provided translator for account deletion confirmation messages", () => {
    const tAny = (key: string, options?: object) =>
      `translated:${key}:${JSON.stringify(options ?? {})}`;
    const schema = createDeleteAccountFormSchema("user@example.com", tAny);

    const invalidEmailResult = schema.safeParse({
      confirmEmail: "bad-email",
    });
    const mismatchResult = schema.safeParse({
      confirmEmail: "other@example.com",
    });

    expect(invalidEmailResult.success).toBe(false);
    expect(invalidEmailResult.error?.issues[0]?.message).toBe(
      "translated:validation.errors.confirmationEmailInvalid:{}"
    );

    expect(mismatchResult.success).toBe(false);
    expect(mismatchResult.error?.issues[0]?.message).toBe(
      "translated:validation.errors.confirmationEmailMismatch:{}"
    );
  });
});
