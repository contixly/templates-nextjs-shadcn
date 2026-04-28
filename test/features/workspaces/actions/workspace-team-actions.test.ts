/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockLoadRequestHeaders = jest.fn();
const mockFindWorkspaceDtoByIdAndUserId = jest.fn();
const mockHasWorkspacePermission = jest.fn();
const mockCreateTeam = jest.fn();
const mockUpdateTeam = jest.fn();
const mockRemoveTeam = jest.fn();
const mockSetActiveTeam = jest.fn();
const mockGetSession = jest.fn();
const mockSetActiveOrganization = jest.fn();
const mockAddTeamMember = jest.fn();
const mockRemoveTeamMember = jest.fn();
const mockFindWorkspaceTeamByIdAndOrganizationIdAndUserId = jest.fn();
const mockFindWorkspaceTeamByOrganizationIdAndNormalizedName = jest.fn();
const mockFindWorkspaceTeamOwnership = jest.fn();
const mockFindWorkspaceTeamMembership = jest.fn();
const mockMemberFindFirst = jest.fn();
const mockUpdateWorkspaceTeamCache = jest.fn();

const ORGANIZATION_ID = "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H";
const TEAM_ID = "d6qzollaqro6y66v7j52bhqo";
const CURRENT_USER_ID = "h6qzollaqro6y66v7j52bhqp";
const TARGET_USER_ID = "a6qzollaqro6y66v7j52bhqq";

jest.mock("@lib/logger", () => ({
  loggerFactory: {
    child: () => ({
      debug: jest.fn(),
      error: jest.fn(),
      child() {
        return this;
      },
    }),
  },
}));

jest.mock("@components/errors/common-error", () => ({
  errors: {
    internalServerError: {
      success: false,
      error: {
        message: "500",
        code: 500,
      },
    },
  },
}));

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
  loadRequestHeaders: (...args: unknown[]) => mockLoadRequestHeaders(...args),
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  findWorkspaceDtoByIdAndUserId: (...args: unknown[]) => mockFindWorkspaceDtoByIdAndUserId(...args),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => mockHasWorkspacePermission(...args),
}));

jest.mock("@features/workspaces/workspaces-teams-repository", () => ({
  findWorkspaceTeamByIdAndOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindWorkspaceTeamByIdAndOrganizationIdAndUserId(...args),
  findWorkspaceTeamByOrganizationIdAndNormalizedName: (...args: unknown[]) =>
    mockFindWorkspaceTeamByOrganizationIdAndNormalizedName(...args),
  findWorkspaceTeamOwnership: (...args: unknown[]) => mockFindWorkspaceTeamOwnership(...args),
  findWorkspaceTeamMembership: (...args: unknown[]) => mockFindWorkspaceTeamMembership(...args),
}));

jest.mock("@features/workspaces/workspaces-teams-types", () => {
  const actual = jest.requireActual("@features/workspaces/workspaces-teams-types");

  return {
    ...actual,
    updateWorkspaceTeamCache: (...args: unknown[]) => mockUpdateWorkspaceTeamCache(...args),
  };
});

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      createTeam: (...args: unknown[]) => mockCreateTeam(...args),
      updateTeam: (...args: unknown[]) => mockUpdateTeam(...args),
      removeTeam: (...args: unknown[]) => mockRemoveTeam(...args),
      setActiveTeam: (...args: unknown[]) => mockSetActiveTeam(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      setActiveOrganization: (...args: unknown[]) => mockSetActiveOrganization(...args),
      addTeamMember: (...args: unknown[]) => mockAddTeamMember(...args),
      removeTeamMember: (...args: unknown[]) => mockRemoveTeamMember(...args),
    },
  },
}));

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    member: {
      findFirst: (...args: unknown[]) => mockMemberFindFirst(...args),
    },
  },
}));

jest.mock("next/navigation", () => ({
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import { addWorkspaceTeamMember } from "@features/workspaces/actions/add-workspace-team-member";
import { createWorkspaceTeam } from "@features/workspaces/actions/create-workspace-team";
import { deleteWorkspaceTeam } from "@features/workspaces/actions/delete-workspace-team";
import { setActiveWorkspaceTeam } from "@features/workspaces/actions/set-active-workspace-team";
import { updateWorkspaceTeam } from "@features/workspaces/actions/update-workspace-team";

describe("workspace team actions", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockLoadRequestHeaders.mockReset();
    mockFindWorkspaceDtoByIdAndUserId.mockReset();
    mockHasWorkspacePermission.mockReset();
    mockCreateTeam.mockReset();
    mockUpdateTeam.mockReset();
    mockRemoveTeam.mockReset();
    mockSetActiveTeam.mockReset();
    mockGetSession.mockReset();
    mockSetActiveOrganization.mockReset();
    mockAddTeamMember.mockReset();
    mockRemoveTeamMember.mockReset();
    mockFindWorkspaceTeamByIdAndOrganizationIdAndUserId.mockReset();
    mockFindWorkspaceTeamByOrganizationIdAndNormalizedName.mockReset();
    mockFindWorkspaceTeamOwnership.mockReset();
    mockFindWorkspaceTeamMembership.mockReset();
    mockMemberFindFirst.mockReset();
    mockUpdateWorkspaceTeamCache.mockReset();

    mockLoadCurrentUserId.mockResolvedValue(CURRENT_USER_ID);
    mockLoadRequestHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: ORGANIZATION_ID });
    mockHasWorkspacePermission.mockResolvedValue(true);
  });

  it("creates a workspace team when the current user has team create permission", async () => {
    mockFindWorkspaceTeamByOrganizationIdAndNormalizedName.mockResolvedValue(null);
    mockCreateTeam.mockResolvedValue({ id: TEAM_ID });
    mockFindWorkspaceTeamByIdAndOrganizationIdAndUserId.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
      memberCount: 0,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    });

    await expect(
      createWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        name: "Design",
      })
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: TEAM_ID,
        name: "Design",
      }),
    });

    expect(mockCreateTeam).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
        name: "Design",
      },
      headers: expect.any(Headers),
    });
    expect(mockUpdateWorkspaceTeamCache).toHaveBeenCalledWith({
      organizationId: ORGANIZATION_ID,
      teamId: TEAM_ID,
      userIds: [CURRENT_USER_ID],
    });
  });

  it("rejects duplicate team names before calling Better Auth", async () => {
    mockFindWorkspaceTeamByOrganizationIdAndNormalizedName.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });

    await expect(
      createWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        name: "design",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.teamDuplicateName",
        code: 409,
      },
    });
    expect(mockCreateTeam).not.toHaveBeenCalled();
  });

  it("rejects team creation when the current member lacks permission", async () => {
    mockHasWorkspacePermission.mockResolvedValue(false);

    await expect(
      createWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        name: "Design",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.teamPermissionDenied",
        code: 403,
      },
    });
    expect(mockCreateTeam).not.toHaveBeenCalled();
  });

  it("renames an owned team through Better Auth", async () => {
    mockFindWorkspaceTeamOwnership.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });
    mockFindWorkspaceTeamByOrganizationIdAndNormalizedName.mockResolvedValue(null);
    mockUpdateTeam.mockResolvedValue({ id: TEAM_ID });
    mockFindWorkspaceTeamByIdAndOrganizationIdAndUserId.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Product",
      memberCount: 0,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-21T10:00:00.000Z"),
    });

    await expect(
      updateWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
        name: "Product",
      })
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        name: "Product",
      }),
    });

    expect(mockUpdateTeam).toHaveBeenCalledWith({
      body: {
        teamId: TEAM_ID,
        data: {
          organizationId: ORGANIZATION_ID,
          name: "Product",
        },
      },
      headers: expect.any(Headers),
    });
  });

  it("syncs the active organization before setting a workspace team active", async () => {
    mockFindWorkspaceTeamOwnership.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });
    mockFindWorkspaceTeamMembership.mockResolvedValue({ id: "membership-1" });
    mockSetActiveOrganization.mockResolvedValue({ id: ORGANIZATION_ID });
    mockSetActiveTeam.mockResolvedValue({ id: TEAM_ID });

    await expect(
      setActiveWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      },
    });

    expect(mockSetActiveOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
      },
      headers: expect.any(Headers),
    });
    expect(mockSetActiveTeam).toHaveBeenCalledWith({
      body: {
        teamId: TEAM_ID,
      },
      headers: expect.any(Headers),
      query: {
        disableCookieCache: true,
      },
    });
    expect(mockSetActiveOrganization.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetActiveTeam.mock.invocationCallOrder[0]
    );
  });

  it("rejects cross-workspace team-member assignment", async () => {
    mockFindWorkspaceTeamOwnership.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });
    mockMemberFindFirst.mockResolvedValue(null);
    mockFindWorkspaceTeamMembership.mockResolvedValue(null);

    await expect(
      addWorkspaceTeamMember({
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
        userId: TARGET_USER_ID,
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.teamMemberCrossWorkspace",
        code: 400,
      },
    });
    expect(mockAddTeamMember).not.toHaveBeenCalled();
  });

  it("rejects duplicate team memberships before calling Better Auth", async () => {
    mockFindWorkspaceTeamOwnership.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });
    mockMemberFindFirst.mockResolvedValue({ id: "member-2", userId: TARGET_USER_ID });
    mockFindWorkspaceTeamMembership.mockResolvedValue({ id: "membership-1" });

    await expect(
      addWorkspaceTeamMember({
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
        userId: TARGET_USER_ID,
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.teamMemberAlreadyExists",
        code: 409,
      },
    });
    expect(mockAddTeamMember).not.toHaveBeenCalled();
  });

  it("deletes the only explicit team without requiring another team", async () => {
    mockFindWorkspaceTeamOwnership.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });
    mockGetSession.mockResolvedValue({
      session: {
        activeTeamId: TEAM_ID,
      },
    });
    mockSetActiveTeam.mockResolvedValue(null);
    mockRemoveTeam.mockResolvedValue({ message: "Team removed successfully." });

    await expect(
      deleteWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      },
    });

    expect(mockSetActiveTeam).toHaveBeenCalledWith({
      body: {
        teamId: null,
      },
      headers: expect.any(Headers),
    });
    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: {
        disableCookieCache: true,
      },
    });
    expect(mockRemoveTeam).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      },
      headers: expect.any(Headers),
      query: {
        disableCookieCache: true,
      },
    });
  });

  it("keeps the current active team when deleting a different team", async () => {
    mockFindWorkspaceTeamOwnership.mockResolvedValue({
      id: TEAM_ID,
      organizationId: ORGANIZATION_ID,
      name: "Design",
    });
    mockGetSession.mockResolvedValue({
      session: {
        activeTeamId: "other-team-id",
      },
    });
    mockRemoveTeam.mockResolvedValue({ message: "Team removed successfully." });

    await expect(
      deleteWorkspaceTeam({
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      },
    });

    expect(mockSetActiveTeam).not.toHaveBeenCalled();
    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: {
        disableCookieCache: true,
      },
    });
    expect(mockRemoveTeam).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
        teamId: TEAM_ID,
      },
      headers: expect.any(Headers),
    });
  });
});
