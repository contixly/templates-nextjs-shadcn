/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockFindWorkspaceDtoByIdAndUserId = jest.fn();
const mockFindOrganizationMemberByOrganizationIdAndUserId = jest.fn();
const mockFindWorkspaceInvitationById = jest.fn();
const mockLoadWorkspaceInvitationDecisionPageContext = jest.fn();
const mockHasWorkspacePermission = jest.fn();
const mockHeaders = jest.fn();
const mockCreateInvitation = jest.fn();
const mockAcceptInvitation = jest.fn();
const mockRejectInvitation = jest.fn();
const mockMemberFindFirst = jest.fn();
const mockMemberCreate = jest.fn();
const mockInvitationFindFirst = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUpdateTags = jest.fn();

jest.mock("@lib/logger", () => ({
  loggerFactory: {
    child: () => ({
      debug: jest.fn(),
      warn: jest.fn(),
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
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  findWorkspaceDtoByIdAndUserId: (...args: unknown[]) => mockFindWorkspaceDtoByIdAndUserId(...args),
  findOrganizationMemberByOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindOrganizationMemberByOrganizationIdAndUserId(...args),
}));

jest.mock("@features/workspaces/workspaces-invitations-repository", () => ({
  findWorkspaceInvitationById: (...args: unknown[]) => mockFindWorkspaceInvitationById(...args),
}));

jest.mock("@features/workspaces/workspaces-invitations", () => ({
  loadWorkspaceInvitationDecisionPageContext: (...args: unknown[]) =>
    mockLoadWorkspaceInvitationDecisionPageContext(...args),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => mockHasWorkspacePermission(...args),
}));

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      createInvitation: (...args: unknown[]) => mockCreateInvitation(...args),
      acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
      rejectInvitation: (...args: unknown[]) => mockRejectInvitation(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    member: {
      findFirst: (...args: unknown[]) => mockMemberFindFirst(...args),
      create: (...args: unknown[]) => mockMemberCreate(...args),
    },
    invitation: {
      findFirst: (...args: unknown[]) => mockInvitationFindFirst(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

jest.mock("@lib/environment", () => ({
  APP_BASE_URL: "https://example.com",
}));

jest.mock("@lib/cache", () => ({
  revalidateTags: jest.fn(),
  updateTags: (...args: unknown[]) => mockUpdateTags(...args),
}));

jest.mock("next/cache", () => ({
  updateTag: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import { createWorkspaceInvitation } from "@features/workspaces/actions/create-workspace-invitation";
import { addWorkspaceMember } from "@features/workspaces/actions/add-workspace-member";
import { acceptWorkspaceInvitation } from "@features/workspaces/actions/accept-workspace-invitation";
import { rejectWorkspaceInvitation } from "@features/workspaces/actions/reject-workspace-invitation";

describe("workspace invitation actions", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockFindWorkspaceDtoByIdAndUserId.mockReset();
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockReset();
    mockFindWorkspaceInvitationById.mockReset();
    mockLoadWorkspaceInvitationDecisionPageContext.mockReset();
    mockHasWorkspacePermission.mockReset();
    mockHeaders.mockReset();
    mockCreateInvitation.mockReset();
    mockAcceptInvitation.mockReset();
    mockRejectInvitation.mockReset();
    mockMemberFindFirst.mockReset();
    mockMemberCreate.mockReset();
    mockInvitationFindFirst.mockReset();
    mockUserFindUnique.mockReset();
    mockUpdateTags.mockReset();

    mockLoadCurrentUserId.mockResolvedValue("user1");
    mockHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
  });

  it("rejects invitation creation when a pending invitation already exists", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockMemberFindFirst.mockResolvedValue(null);
    mockInvitationFindFirst.mockResolvedValue({ id: "invite1" });

    await expect(
      createWorkspaceInvitation({
        organizationId: "org1",
        email: "alice@example.com",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.invitationAlreadyExists",
        code: 409,
      },
    });
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });

  it("rejects add-member requests when the user is already a member", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue({ id: "user2" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({ id: "member1" });

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.memberAlreadyExists",
        code: 409,
      },
    });
    expect(mockMemberCreate).not.toHaveBeenCalled();
  });

  it("accepts an invitation and returns the workspace payload", async () => {
    mockLoadWorkspaceInvitationDecisionPageContext.mockResolvedValue({
      invitation: {
        id: "invite1",
        organizationId: "org1",
        email: "alice@example.com",
      },
      state: "pending",
      canRespond: true,
    });
    mockAcceptInvitation.mockResolvedValue(undefined);
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: null,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      isDefault: false,
    });

    const result = await acceptWorkspaceInvitation({ invitationId: "invite1" });

    expect(mockAcceptInvitation).toHaveBeenCalledWith({
      body: {
        invitationId: "invite1",
      },
      headers: expect.any(Headers),
    });
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "org1",
        slug: "acme",
      }),
    });
  });

  it("rejects an invitation when the decision loader marks it as expired", async () => {
    mockLoadWorkspaceInvitationDecisionPageContext.mockResolvedValue({
      invitation: {
        id: "invite1",
        organizationId: "org1",
        email: "alice@example.com",
      },
      state: "expired",
      canRespond: false,
    });

    await expect(rejectWorkspaceInvitation({ invitationId: "invite1" })).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.invitationExpired",
        code: 409,
      },
    });
    expect(mockRejectInvitation).not.toHaveBeenCalled();
  });
});
