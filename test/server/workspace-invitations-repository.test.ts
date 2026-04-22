/** @jest-environment node */

const cacheLifeMock = jest.fn();
const cacheTagMock = jest.fn();

const findManyMock = jest.fn();
const findUniqueMock = jest.fn();

jest.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => cacheLifeMock(...args),
  cacheTag: (...args: unknown[]) => cacheTagMock(...args),
}));

jest.mock("../../src/server/prisma", () => ({
  __esModule: true,
  default: {
    invitation: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

jest.mock("../../src/features/workspaces/workspaces-logger", () => ({
  workspacesLogger: {
    child: () => ({
      child: () => ({
        debug: jest.fn(),
      }),
      debug: jest.fn(),
    }),
  },
}));

jest.mock("../../src/lib/environment", () => ({
  APP_BASE_URL: "https://example.com",
}));

import {
  findManyPendingWorkspaceInvitationsByEmail,
  findManyWorkspaceInvitationsByOrganizationIdAndUserId,
  findWorkspaceInvitationById,
} from "@features/workspaces/workspaces-invitations-repository";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationMembersTag,
  CACHE_OrganizationsByUserIdTag,
} from "@features/organizations/organizations-types";
import {
  CACHE_PendingWorkspaceInvitationsByEmailTag,
  CACHE_WorkspaceInvitationByIdTag,
  CACHE_WorkspaceInvitationsTag,
} from "@features/workspaces/workspaces-invitations-types";

const invitationRecord = {
  id: "invite1",
  organizationId: "org1",
  email: "alice@example.com",
  role: "owner, member, owner",
  status: "pending",
  expiresAt: new Date("2026-04-25T10:00:00.000Z"),
  createdAt: new Date("2026-04-20T10:00:00.000Z"),
  inviterId: "user2",
  organization: {
    id: "org1",
    name: "Acme",
    slug: "acme",
  },
  inviter: {
    id: "user2",
    name: "Inviter",
    email: "inviter@example.com",
  },
};

describe("workspace invitations repository", () => {
  beforeEach(() => {
    cacheLifeMock.mockReset();
    cacheTagMock.mockReset();
    findManyMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("normalizes pending-email lookups, maps DTOs, and tags returned invitations", async () => {
    findManyMock.mockResolvedValue([invitationRecord]);

    const invitations = await findManyPendingWorkspaceInvitationsByEmail(" Alice@Example.com ");

    expect(cacheLifeMock).toHaveBeenCalledWith("hours");
    expect(cacheTagMock).toHaveBeenNthCalledWith(
      1,
      CACHE_PendingWorkspaceInvitationsByEmailTag("alice@example.com")
    );
    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        email: "alice@example.com",
        status: "pending",
      },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      select: expect.any(Object),
    });
    expect(cacheTagMock).toHaveBeenNthCalledWith(
      2,
      CACHE_WorkspaceInvitationByIdTag("invite1"),
      CACHE_WorkspaceInvitationsTag("org1")
    );
    expect(invitations).toEqual([
      expect.objectContaining({
        id: "invite1",
        email: "alice@example.com",
        roleLabels: ["owner", "member"],
        invitationUrl: "https://example.com/invite/invite1",
      }),
    ]);
  });

  it("tags workspace-scoped invitation lists by workspace, members, and returned invitations", async () => {
    findManyMock.mockResolvedValue([invitationRecord]);

    await findManyWorkspaceInvitationsByOrganizationIdAndUserId("org1", "user1");

    expect(cacheLifeMock).toHaveBeenCalledWith("hours");
    expect(cacheTagMock).toHaveBeenNthCalledWith(
      1,
      CACHE_WorkspaceInvitationsTag("org1"),
      CACHE_OrganizationByIdTag("org1"),
      CACHE_OrganizationMembersTag("org1"),
      CACHE_OrganizationsByUserIdTag("user1")
    );
    expect(cacheTagMock).toHaveBeenNthCalledWith(
      2,
      CACHE_WorkspaceInvitationByIdTag("invite1"),
      CACHE_PendingWorkspaceInvitationsByEmailTag("alice@example.com")
    );
  });

  it("keeps per-invitation cache tagging even when a lookup misses", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(findWorkspaceInvitationById("invite1")).resolves.toBeNull();

    expect(cacheLifeMock).toHaveBeenCalledWith("hours");
    expect(cacheTagMock).toHaveBeenCalledWith(CACHE_WorkspaceInvitationByIdTag("invite1"));
  });
});
