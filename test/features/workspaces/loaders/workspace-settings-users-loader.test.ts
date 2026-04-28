/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockCountAccessibleOrganizationsByUserId = jest.fn();
const mockFindWorkspaceDtoByKeyAndUserId = jest.fn();
const mockFindManyAccessibleOrganizationMembersByIdAndUserId = jest.fn();
const mockFindOrganizationMemberByOrganizationIdAndUserId = jest.fn();
const mockHasWorkspacePermission = jest.fn();
const mockFindManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId = jest.fn();
const mockFindManyWorkspaceTeamMembersByTeamIdAndUserId = jest.fn();
const mockFindManyWorkspaceTeamsByOrganizationIdAndUserId = jest.fn();

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  countAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    mockCountAccessibleOrganizationsByUserId(...args),
  findWorkspaceDtoByKeyAndUserId: (...args: unknown[]) =>
    mockFindWorkspaceDtoByKeyAndUserId(...args),
  findManyAccessibleOrganizationMembersByIdAndUserId: (...args: unknown[]) =>
    mockFindManyAccessibleOrganizationMembersByIdAndUserId(...args),
  findOrganizationMemberByOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindOrganizationMemberByOrganizationIdAndUserId(...args),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => mockHasWorkspacePermission(...args),
}));

jest.mock("@features/workspaces/workspaces-teams-repository", () => ({
  findManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId(...args),
  findManyWorkspaceTeamMembersByTeamIdAndUserId: (...args: unknown[]) =>
    mockFindManyWorkspaceTeamMembersByTeamIdAndUserId(...args),
  findManyWorkspaceTeamsByOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindManyWorkspaceTeamsByOrganizationIdAndUserId(...args),
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
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockReset();
    mockHasWorkspacePermission.mockReset();
    mockFindManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId.mockReset();
    mockFindManyWorkspaceTeamMembersByTeamIdAndUserId.mockReset();
    mockFindManyWorkspaceTeamsByOrganizationIdAndUserId.mockReset();
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
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-current",
      role: "owner",
    });
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
      canDeleteWorkspace: true,
      canCreateInvitations: true,
      canonicalOrganizationKey: "acme",
      currentUserId: "user-123",
      currentMemberRole: "owner",
      assignableWorkspaceRoles: ["member", "admin", "owner"],
      canAddMembers: true,
      canUpdateMemberRoles: true,
      members: [
        expect.objectContaining({
          id: "member-1",
          userId: "user-123",
          roleLabels: ["owner", "billing"],
          emailDomain: "example.com",
          isOutsideAllowedEmailDomains: false,
        }),
      ],
    });

    expect(mockFindManyAccessibleOrganizationMembersByIdAndUserId).toHaveBeenCalledWith(
      "org-42",
      "user-123"
    );
  });

  it("derives member domain-policy markers from active workspace restrictions", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockCountAccessibleOrganizationsByUserId.mockResolvedValue(2);
    mockFindWorkspaceDtoByKeyAndUserId.mockResolvedValue({
      id: "org-42",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: {
        allowedEmailDomains: ["example.com"],
      },
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-current",
      role: "owner",
    });
    mockFindManyAccessibleOrganizationMembersByIdAndUserId.mockResolvedValue([
      {
        id: "member-1",
        userId: "user-123",
        name: "Alice Adams",
        email: "alice@example.com",
        image: null,
        roleLabels: ["owner"],
        joinedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
      {
        id: "member-2",
        userId: "user-456",
        name: "Bob Brown",
        email: "bob@outside.test",
        image: null,
        roleLabels: ["member"],
        joinedAt: new Date("2026-04-21T10:00:00.000Z"),
      },
    ]);

    await expect(loadWorkspaceSettingsUsersPageContext("org-42")).resolves.toMatchObject({
      members: [
        expect.objectContaining({
          userId: "user-123",
          emailDomain: "example.com",
          isOutsideAllowedEmailDomains: false,
        }),
        expect.objectContaining({
          userId: "user-456",
          emailDomain: "outside.test",
          isOutsideAllowedEmailDomains: true,
        }),
      ],
    });
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
    });
    mockHasWorkspacePermission.mockResolvedValue(false);
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-current",
      role: "member",
    });
    mockFindManyAccessibleOrganizationMembersByIdAndUserId.mockResolvedValue([]);

    await expect(loadWorkspaceSettingsUsersPageContext("org-42")).resolves.toEqual({
      workspace: expect.objectContaining({
        id: "org-42",
        slug: "acme",
      }),
      canUpdateWorkspace: false,
      canDeleteWorkspace: false,
      canCreateInvitations: false,
      canonicalOrganizationKey: "acme",
      currentUserId: "user-123",
      currentMemberRole: "member",
      assignableWorkspaceRoles: [],
      canAddMembers: false,
      canUpdateMemberRoles: false,
      members: [],
    });
  });

  it("throws unauthorized when the current user cannot be resolved", async () => {
    mockLoadCurrentUserId.mockResolvedValue(null);

    await expect(loadWorkspaceSettingsUsersPageContext("org-42")).rejects.toThrow("unauthorized");
  });
});
