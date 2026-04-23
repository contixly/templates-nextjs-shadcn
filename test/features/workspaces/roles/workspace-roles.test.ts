import {
  canAssignWorkspaceRole,
  canUpdateWorkspaceMemberRole,
  getAssignableWorkspaceRoles,
  getSingleWorkspaceManageableRole,
  isWorkspaceManageableRole,
} from "@features/workspaces/workspaces-roles";

describe("workspace role helpers", () => {
  it("exposes the built-in manageable roles and assignability policy", () => {
    expect(isWorkspaceManageableRole("member")).toBe(true);
    expect(isWorkspaceManageableRole("admin")).toBe(true);
    expect(isWorkspaceManageableRole("owner")).toBe(true);
    expect(isWorkspaceManageableRole("billing")).toBe(false);

    expect(getAssignableWorkspaceRoles("member")).toEqual([]);
    expect(getAssignableWorkspaceRoles("admin")).toEqual(["member", "admin"]);
    expect(getAssignableWorkspaceRoles("owner")).toEqual(["member", "admin", "owner"]);
    expect(getAssignableWorkspaceRoles("billing, owner")).toEqual(["member", "admin", "owner"]);
  });

  it("derives a single manageable role only for supported single-role values", () => {
    expect(getSingleWorkspaceManageableRole("admin")).toBe("admin");
    expect(getSingleWorkspaceManageableRole("admin, member")).toBeNull();
    expect(getSingleWorkspaceManageableRole("billing")).toBeNull();
  });

  it("protects owner rows from non-owner role updates and blocks self edits", () => {
    expect(
      canUpdateWorkspaceMemberRole({
        actorRole: "admin",
        currentUserId: "user-1",
        targetRole: "owner",
        targetUserId: "user-2",
      })
    ).toBe(false);
    expect(
      canUpdateWorkspaceMemberRole({
        actorRole: "owner",
        currentUserId: "user-1",
        targetRole: "owner",
        targetUserId: "user-2",
      })
    ).toBe(true);
    expect(
      canUpdateWorkspaceMemberRole({
        actorRole: "owner",
        currentUserId: "user-1",
        targetRole: "admin",
        targetUserId: "user-1",
      })
    ).toBe(false);
    expect(
      canUpdateWorkspaceMemberRole({
        actorRole: "owner",
        currentUserId: "user-1",
        targetRole: "billing",
        targetUserId: "user-2",
      })
    ).toBe(false);
  });

  it("checks selected role assignment against the acting member role", () => {
    expect(canAssignWorkspaceRole("admin", "admin")).toBe(true);
    expect(canAssignWorkspaceRole("admin", "owner")).toBe(false);
    expect(canAssignWorkspaceRole("owner", "owner")).toBe(true);
    expect(canAssignWorkspaceRole("member", "member")).toBe(false);
  });
});
