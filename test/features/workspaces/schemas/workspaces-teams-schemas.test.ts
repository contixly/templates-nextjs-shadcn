import * as workspaceTeamSchemas from "@features/workspaces/workspaces-teams-schemas";
import {
  addWorkspaceTeamMemberSchema,
  createUpdateWorkspaceTeamFormSchema,
  createWorkspaceTeamFormSchema,
} from "@features/workspaces/workspaces-teams-schemas";

const tAny = (key: string, options?: object) =>
  `translated:${key}${options ? `:${JSON.stringify(options)}` : ""}`;

describe("workspace team schemas", () => {
  it("normalizes team names and accepts team membership inputs", () => {
    const createResult = createWorkspaceTeamFormSchema(tAny).safeParse({
      organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
      name: "  Design Team  ",
    });

    expect(createResult.success).toBe(true);
    expect(createResult.data?.name).toBe("Design Team");

    expect(
      addWorkspaceTeamMemberSchema.safeParse({
        organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
        teamId: "d6qzollaqro6y66v7j52bhqo",
        userId: "h6qzollaqro6y66v7j52bhqp",
      }).success
    ).toBe(true);
  });

  it("rejects invalid or unchanged team names with localized errors", () => {
    const invalidResult = createWorkspaceTeamFormSchema(tAny).safeParse({
      organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
      name: "!!!",
    });
    const unchangedResult = createUpdateWorkspaceTeamFormSchema("Design", tAny).safeParse({
      organizationId: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
      teamId: "d6qzollaqro6y66v7j52bhqo",
      name: " design ",
    });

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error?.issues[0]?.message).toBe(
      "translated:validation.errors.teamNameInvalidCharacters"
    );
    expect(unchangedResult.success).toBe(false);
    expect(unchangedResult.error?.issues[0]?.message).toBe(
      "translated:validation.errors.teamNameUnchanged"
    );
  });

  it("does not expose a set-active-team workspace schema", () => {
    expect(workspaceTeamSchemas).not.toHaveProperty("setActiveWorkspaceTeamSchema");
  });
});
