/** @jest-environment node */

const mockTeamFindMany = jest.fn();
const mockTeamFindFirst = jest.fn();
const mockTeamMemberFindMany = jest.fn();
const mockMemberFindMany = jest.fn();
const mockCacheTag = jest.fn();
const mockUpdateTags = jest.fn();

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    team: {
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
      findFirst: (...args: unknown[]) => mockTeamFindFirst(...args),
    },
    teamMember: {
      findMany: (...args: unknown[]) => mockTeamMemberFindMany(...args),
      findFirst: jest.fn(),
    },
    member: {
      findMany: (...args: unknown[]) => mockMemberFindMany(...args),
    },
  },
}));

jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: (...args: unknown[]) => mockCacheTag(...args),
}));

jest.mock("@lib/cache", () => ({
  revalidateTags: jest.fn(),
  updateTags: (...args: unknown[]) => mockUpdateTags(...args),
}));

jest.mock("@lib/logger", () => ({
  loggerFactory: {
    child: () => ({
      debug: jest.fn(),
      child() {
        return this;
      },
    }),
  },
}));

import {
  CACHE_WorkspaceInvitationsByTeamIdTag,
  CACHE_WorkspaceInvitationsTag,
} from "@features/workspaces/workspaces-invitations-cache";
import {
  findManyWorkspaceTeamMembersByTeamIdAndOrganizationId,
  findManyWorkspaceTeamsByOrganizationId,
  findManyWorkspaceTeamMembersByTeamIdAndUserId,
  findManyWorkspaceTeamsByOrganizationIdAndUserId,
  findWorkspaceTeamByIdAndOrganizationId,
  findWorkspaceTeamByOrganizationIdAndNormalizedName,
} from "@features/workspaces/workspaces-teams-repository";
import { updateWorkspaceTeamCache } from "@features/workspaces/workspaces-teams-types";

describe("workspace teams repository", () => {
  beforeEach(() => {
    mockTeamFindMany.mockReset();
    mockTeamFindFirst.mockReset();
    mockTeamMemberFindMany.mockReset();
    mockMemberFindMany.mockReset();
    mockCacheTag.mockReset();
    mockUpdateTags.mockReset();
  });

  it("loads accessible teams with member counts and cache tags", async () => {
    mockTeamFindMany.mockResolvedValue([
      {
        id: "team-1",
        organizationId: "org-1",
        name: "Design",
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-21T10:00:00.000Z"),
        _count: {
          members: 2,
        },
      },
    ]);

    await expect(
      findManyWorkspaceTeamsByOrganizationIdAndUserId("org-1", "user-1")
    ).resolves.toEqual([
      {
        id: "team-1",
        organizationId: "org-1",
        name: "Design",
        memberCount: 2,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-21T10:00:00.000Z"),
      },
    ]);

    expect(mockTeamFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          organization: {
            members: {
              some: {
                userId: "user-1",
              },
            },
          },
        }),
      })
    );
    expect(mockCacheTag).toHaveBeenCalledWith(
      "organization_org-1_teams",
      "organization_org-1",
      "organization_org-1_members",
      "organizations_user_user-1"
    );
    expect(mockCacheTag).toHaveBeenCalledTimes(1);
  });

  it("loads team members with workspace role labels", async () => {
    mockTeamMemberFindMany.mockResolvedValue([
      {
        id: "membership-1",
        teamId: "team-1",
        userId: "user-2",
        createdAt: new Date("2026-04-22T10:00:00.000Z"),
        user: {
          name: "Alice",
          email: "alice@example.com",
          image: null,
          members: [
            {
              role: "admin,member",
              createdAt: new Date("2026-04-20T10:00:00.000Z"),
            },
          ],
        },
      },
    ]);

    await expect(
      findManyWorkspaceTeamMembersByTeamIdAndUserId("team-1", "org-1", "user-1")
    ).resolves.toEqual([
      expect.objectContaining({
        id: "membership-1",
        userId: "user-2",
        roleLabels: ["admin", "member"],
        joinedAt: new Date("2026-04-20T10:00:00.000Z"),
      }),
    ]);
  });

  it("loads team members by team id and organization id without a user principal", async () => {
    mockTeamMemberFindMany.mockResolvedValue([
      {
        id: "membership_1",
        teamId: "team_1",
        userId: "user_2",
        createdAt: new Date("2026-05-02T10:00:00.000Z"),
        user: {
          name: "Alice",
          email: "alice@example.com",
          image: null,
          members: [
            {
              role: "admin,member",
              createdAt: new Date("2026-05-01T10:00:00.000Z"),
            },
          ],
        },
      },
    ]);

    await expect(
      findManyWorkspaceTeamMembersByTeamIdAndOrganizationId("team_1", "org_1")
    ).resolves.toEqual([
      expect.objectContaining({
        id: "membership_1",
        teamId: "team_1",
        userId: "user_2",
        roleLabels: ["admin", "member"],
      }),
    ]);
    expect(mockCacheTag).toHaveBeenCalledWith(
      "organization_org_1_teams",
      "workspace_team_team_1",
      "workspace_team_team_1_members",
      "organization_org_1_members"
    );
    expect(mockTeamMemberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          teamId: "team_1",
          team: {
            organizationId: "org_1",
          },
        },
      })
    );
  });

  it("checks team-name uniqueness case-insensitively within an organization", async () => {
    mockTeamFindFirst.mockResolvedValue({ id: "team-1", name: "Design", organizationId: "org-1" });

    await findWorkspaceTeamByOrganizationIdAndNormalizedName({
      organizationId: "org-1",
      name: " DESIGN ",
      excludeTeamId: "team-2",
    });

    expect(mockTeamFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        name: {
          equals: "design",
          mode: "insensitive",
        },
        NOT: {
          id: "team-2",
        },
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });
  });

  it("loads workspace teams by organization id without a user principal", async () => {
    mockTeamFindMany.mockResolvedValue(
      Array.from({ length: 70 }, (_, index) => ({
        id: `team_${index + 1}`,
        organizationId: "org_1",
        name: `Platform ${index + 1}`,
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        updatedAt: new Date("2026-05-01T10:00:00.000Z"),
        _count: { members: 2 },
      }))
    );

    await expect(findManyWorkspaceTeamsByOrganizationId("org_1")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "team_1",
          organizationId: "org_1",
          memberCount: 2,
        }),
      ])
    );
    expect(mockTeamFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org_1",
        },
      })
    );
    expect(mockCacheTag).toHaveBeenCalledWith("organization_org_1_teams", "organization_org_1");
    expect(mockCacheTag).toHaveBeenCalledTimes(1);
  });

  it("loads one workspace team by id and organization id without a user principal", async () => {
    mockTeamFindFirst.mockResolvedValue({
      id: "team_1",
      organizationId: "org_1",
      name: "Platform",
      createdAt: new Date("2026-05-01T10:00:00.000Z"),
      updatedAt: new Date("2026-05-01T10:00:00.000Z"),
      _count: { members: 2 },
    });

    await expect(findWorkspaceTeamByIdAndOrganizationId("team_1", "org_1")).resolves.toEqual(
      expect.objectContaining({
        id: "team_1",
        organizationId: "org_1",
        memberCount: 2,
      })
    );
    expect(mockTeamFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "team_1",
          organizationId: "org_1",
        },
      })
    );
  });

  it("updates team, member, organization, and user cache tags", () => {
    updateWorkspaceTeamCache({
      organizationId: "org-1",
      teamId: "team-1",
      userIds: ["user-1", "user-2"],
    });

    expect(mockUpdateTags).toHaveBeenCalledWith([
      "organization_org-1_teams",
      "organization_org-1",
      "organization_org-1_members",
      CACHE_WorkspaceInvitationsTag("org-1"),
      "workspace_team_team-1",
      "workspace_team_team-1_members",
      CACHE_WorkspaceInvitationsByTeamIdTag("team-1"),
      "organizations_user_user-1",
      "organizations_user_user-2",
    ]);
  });
});
