/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockCountAccessibleOrganizationsByUserId = jest.fn();
const mockFindWorkspaceDtoByKeyAndUserId = jest.fn();
const mockFindManyAccessibleOrganizationMembersByIdAndUserId = jest.fn();
const mockHasWorkspacePermission = jest.fn();

jest.mock("../../src/features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
}));

jest.mock("../../src/features/organizations/organizations-repository", () => ({
  countAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    mockCountAccessibleOrganizationsByUserId(...args),
  findWorkspaceDtoByKeyAndUserId: (...args: unknown[]) =>
    mockFindWorkspaceDtoByKeyAndUserId(...args),
  findManyAccessibleOrganizationMembersByIdAndUserId: (...args: unknown[]) =>
    mockFindManyAccessibleOrganizationMembersByIdAndUserId(...args),
}));

jest.mock("../../src/features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => mockHasWorkspacePermission(...args),
}));

jest.mock("next/navigation", () => ({
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import { loadWorkspaceSettingsUsersPageContext } from "@features/workspaces/workspaces-settings";

describe("loadWorkspaceSettingsUsersPageContext", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockCountAccessibleOrganizationsByUserId.mockReset();
    mockFindWorkspaceDtoByKeyAndUserId.mockReset();
    mockFindManyAccessibleOrganizationMembersByIdAndUserId.mockReset();
    mockHasWorkspacePermission.mockReset();
  });

  it("loads the canonical workspace context together with visible organization members", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockCountAccessibleOrganizationsByUserId.mockResolvedValue(2);
    mockFindWorkspaceDtoByKeyAndUserId.mockResolvedValue({
      id: "org-42",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: null,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      isDefault: false,
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockFindManyAccessibleOrganizationMembersByIdAndUserId.mockResolvedValue([
      {
        id: "member-1",
        userId: "user-123",
        name: "Alice Adams",
        email: "alice@example.com",
        image: null,
        roleLabels: ["owner", "billing"],
        joinedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
    ]);

    await expect(loadWorkspaceSettingsUsersPageContext("org-42")).resolves.toEqual({
      workspace: expect.objectContaining({
        id: "org-42",
        slug: "acme",
      }),
      canUpdateWorkspace: true,
      canChangeDefault: true,
      canDeleteWorkspace: true,
      canCreateInvitations: true,
      canonicalOrganizationKey: "acme",
      currentUserId: "user-123",
      canAddMembers: true,
      members: [
        expect.objectContaining({
          id: "member-1",
          userId: "user-123",
          roleLabels: ["owner", "billing"],
        }),
      ],
    });

    expect(mockFindManyAccessibleOrganizationMembersByIdAndUserId).toHaveBeenCalledWith(
      "org-42",
      "user-123"
    );
  });

  it("keeps the workspace readable while disabling all admin capabilities for a regular member", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockCountAccessibleOrganizationsByUserId.mockResolvedValue(2);
    mockFindWorkspaceDtoByKeyAndUserId.mockResolvedValue({
      id: "org-42",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: null,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      isDefault: false,
    });
    mockHasWorkspacePermission.mockResolvedValue(false);
    mockFindManyAccessibleOrganizationMembersByIdAndUserId.mockResolvedValue([]);

    await expect(loadWorkspaceSettingsUsersPageContext("org-42")).resolves.toEqual({
      workspace: expect.objectContaining({
        id: "org-42",
        slug: "acme",
      }),
      canUpdateWorkspace: false,
      canChangeDefault: false,
      canDeleteWorkspace: false,
      canCreateInvitations: false,
      canonicalOrganizationKey: "acme",
      currentUserId: "user-123",
      canAddMembers: false,
      members: [],
    });
  });

  it("throws unauthorized when the current user cannot be resolved", async () => {
    mockLoadCurrentUserId.mockResolvedValue(null);

    await expect(loadWorkspaceSettingsUsersPageContext("org-42")).rejects.toThrow("unauthorized");
  });
});
