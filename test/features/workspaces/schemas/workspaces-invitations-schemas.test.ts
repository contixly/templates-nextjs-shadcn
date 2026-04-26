import {
  addWorkspaceMemberFormSchema,
  createWorkspaceInvitationFormSchema,
  updateWorkspaceMemberRoleFormSchema,
} from "@features/workspaces/workspaces-invitations-schemas";

const tAny = (key: string) => `translated:${key}`;

describe("workspace invitation and member schemas", () => {
  it("accepts a selected role for invitation creation, direct member addition, and role updates", () => {
    expect(
      createWorkspaceInvitationFormSchema(tAny).safeParse({
        organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
        email: "ADMIN@EXAMPLE.COM",
        role: "admin",
      }).success
    ).toBe(true);
    expect(
      addWorkspaceMemberFormSchema(tAny).safeParse({
        organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
        userId: "d6qzollaqro6y66v7j52bhqo",
        role: "member",
        acknowledgeDomainRestriction: true,
      }).success
    ).toBe(true);
    expect(
      updateWorkspaceMemberRoleFormSchema(tAny).safeParse({
        organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
        memberId: "d6qzollaqro6y66v7j52bhqo",
        role: "owner",
      }).success
    ).toBe(true);
  });

  it("rejects unsupported role values with localized form errors", () => {
    const result = createWorkspaceInvitationFormSchema(tAny).safeParse({
      organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
      email: "admin@example.com",
      role: "billing",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "translated:validation.errors.workspaceRoleInvalid"
    );
  });
});
