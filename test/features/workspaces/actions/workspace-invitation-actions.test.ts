/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockLoadRequestHeaders = jest.fn();
const mockFindWorkspaceDtoByIdAndUserId = jest.fn();
const mockFindOrganizationMemberByOrganizationIdAndUserId = jest.fn();
const mockFindWorkspaceInvitationById = jest.fn();
const mockLoadWorkspaceInvitationDecisionPageContext = jest.fn();
const mockHasWorkspacePermission = jest.fn();
const mockHeaders = jest.fn();
const mockCreateInvitation = jest.fn();
const mockAddMember = jest.fn();
const mockUpdateMemberRole = jest.fn();
const mockAcceptInvitation = jest.fn();
const mockSetActiveOrganization = jest.fn();
const mockRejectInvitation = jest.fn();
const mockMemberFindFirst = jest.fn();
const mockMemberCreate = jest.fn();
const mockInvitationFindFirst = jest.fn();
const mockInvitationUpdateMany = jest.fn();
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
  loadRequestHeaders: (...args: unknown[]) => mockLoadRequestHeaders(...args),
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
      addMember: (...args: unknown[]) => mockAddMember(...args),
      updateMemberRole: (...args: unknown[]) => mockUpdateMemberRole(...args),
      acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
      setActiveOrganization: (...args: unknown[]) => mockSetActiveOrganization(...args),
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
      updateMany: (...args: unknown[]) => mockInvitationUpdateMany(...args),
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
import { updateWorkspaceMemberRole } from "@features/workspaces/actions/update-workspace-member-role";
import { acceptWorkspaceInvitation } from "@features/workspaces/actions/accept-workspace-invitation";
import { rejectWorkspaceInvitation } from "@features/workspaces/actions/reject-workspace-invitation";

describe("workspace invitation actions", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockLoadRequestHeaders.mockReset();
    mockFindWorkspaceDtoByIdAndUserId.mockReset();
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockReset();
    mockFindWorkspaceInvitationById.mockReset();
    mockLoadWorkspaceInvitationDecisionPageContext.mockReset();
    mockHasWorkspacePermission.mockReset();
    mockHeaders.mockReset();
    mockCreateInvitation.mockReset();
    mockAddMember.mockReset();
    mockUpdateMemberRole.mockReset();
    mockAcceptInvitation.mockReset();
    mockSetActiveOrganization.mockReset();
    mockRejectInvitation.mockReset();
    mockMemberFindFirst.mockReset();
    mockMemberCreate.mockReset();
    mockInvitationFindFirst.mockReset();
    mockInvitationUpdateMany.mockReset();
    mockUserFindUnique.mockReset();
    mockUpdateTags.mockReset();

    mockLoadCurrentUserId.mockResolvedValue("user1");
    mockLoadRequestHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockInvitationUpdateMany.mockResolvedValue({ count: 0 });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "owner",
      userId: "user1",
    });
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
        role: "member",
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

  it("creates invitations with the selected assignable role", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "owner",
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockMemberFindFirst.mockResolvedValue(null);
    mockInvitationFindFirst.mockResolvedValue(null);
    mockCreateInvitation.mockResolvedValue({ id: "invite1" });
    mockFindWorkspaceInvitationById.mockResolvedValue({
      id: "invite1",
      organizationId: "org1",
      organizationName: "Acme",
      organizationSlug: "acme",
      email: "alice@example.com",
      role: "admin",
      roleLabels: ["admin"],
      status: "pending",
      displayStatus: "pending",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      inviterId: "user1",
      inviterName: "Owner",
      inviterEmail: "owner@example.com",
      invitationUrl: "https://example.com/invite/invite1",
    });

    await expect(
      createWorkspaceInvitation({
        organizationId: "org1",
        email: "alice@example.com",
        role: "admin",
      })
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: "invite1",
        role: "admin",
      }),
    });

    expect(mockCreateInvitation).toHaveBeenCalledWith({
      body: {
        organizationId: "org1",
        email: "alice@example.com",
        role: "admin",
      },
      headers: expect.any(Headers),
    });
  });

  it("creates invitations when the recipient domain is allowed by workspace restrictions", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      metadata: {
        allowedEmailDomains: ["example.com"],
      },
    });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "owner",
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockMemberFindFirst.mockResolvedValue(null);
    mockInvitationFindFirst.mockResolvedValue(null);
    mockCreateInvitation.mockResolvedValue({ id: "invite1" });
    mockFindWorkspaceInvitationById.mockResolvedValue({
      id: "invite1",
      organizationId: "org1",
      organizationName: "Acme",
      organizationSlug: "acme",
      email: "alice@example.com",
      role: "member",
      roleLabels: ["member"],
      status: "pending",
      displayStatus: "pending",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      inviterId: "user1",
      inviterName: "Owner",
      inviterEmail: "owner@example.com",
      invitationUrl: "https://example.com/invite/invite1",
    });

    await expect(
      createWorkspaceInvitation({
        organizationId: "org1",
        email: "alice@example.com",
        role: "member",
      })
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: "invite1",
      }),
    });
  });

  it("rejects invitation creation when the recipient domain is outside active restrictions", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      metadata: {
        allowedEmailDomains: ["example.com"],
      },
    });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "owner",
    });
    mockHasWorkspacePermission.mockResolvedValue(true);

    await expect(
      createWorkspaceInvitation({
        organizationId: "org1",
        email: "alice@outside.test",
        role: "member",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.invitationDomainRestricted",
        code: 400,
      },
    });

    expect(mockInvitationUpdateMany).not.toHaveBeenCalled();
    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });

  it("rejects non-owner attempts to invite an owner before calling Better Auth", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "admin",
    });
    mockHasWorkspacePermission.mockResolvedValue(true);

    await expect(
      createWorkspaceInvitation({
        organizationId: "org1",
        email: "alice@example.com",
        role: "owner",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.workspaceRolePermissionDenied",
        code: 403,
      },
    });

    expect(mockCreateInvitation).not.toHaveBeenCalled();
  });

  it("rejects add-member requests when the user is already a member", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue({ id: "user2", email: "user2@example.com" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockImplementation(
      (_organizationId: string, userId: string) =>
        userId === "user1" ? { id: "member-actor", role: "owner" } : { id: "member1" }
    );

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
        role: "member",
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

  it("adds members through Better Auth with the selected assignable role", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue({ id: "user2", email: "user2@example.com" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockImplementation(
      (_organizationId: string, userId: string) =>
        userId === "user1" ? { id: "member-actor", role: "owner" } : null
    );
    mockAddMember.mockResolvedValue({
      id: "member2",
      organizationId: "org1",
      userId: "user2",
      role: "admin",
    });

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
        role: "admin",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        organizationId: "org1",
        userId: "user2",
      },
    });

    expect(mockAddMember).toHaveBeenCalledWith({
      body: {
        organizationId: "org1",
        userId: "user2",
        role: "admin",
      },
      headers: expect.any(Headers),
    });
    expect(mockMemberCreate).not.toHaveBeenCalled();
  });

  it("returns a direct-add warning when the target user is outside active domain restrictions", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      metadata: {
        allowedEmailDomains: ["example.com"],
      },
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue({ id: "user2", email: "user2@outside.test" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockImplementation(
      (_organizationId: string, userId: string) =>
        userId === "user1" ? { id: "member-actor", role: "owner" } : null
    );

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
        role: "member",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        status: "domain-restriction-warning",
        organizationId: "org1",
        userId: "user2",
        email: "user2@outside.test",
        emailDomain: "outside.test",
        allowedEmailDomains: ["example.com"],
        role: "member",
      },
    });

    expect(mockAddMember).not.toHaveBeenCalled();
  });

  it("adds an out-of-policy user when the direct-add warning is acknowledged", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      metadata: {
        allowedEmailDomains: ["example.com"],
      },
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue({ id: "user2", email: "user2@outside.test" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockImplementation(
      (_organizationId: string, userId: string) =>
        userId === "user1" ? { id: "member-actor", role: "owner" } : null
    );
    mockAddMember.mockResolvedValue({
      id: "member2",
      organizationId: "org1",
      userId: "user2",
      role: "admin",
    });

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
        role: "admin",
        acknowledgeDomainRestriction: true,
      })
    ).resolves.toEqual({
      success: true,
      data: {
        organizationId: "org1",
        userId: "user2",
      },
    });

    expect(mockAddMember).toHaveBeenCalledWith({
      body: {
        organizationId: "org1",
        userId: "user2",
        role: "admin",
      },
      headers: expect.any(Headers),
    });
  });

  it("rejects direct-add requests for a missing target user before domain checks", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      metadata: {
        allowedEmailDomains: ["example.com"],
      },
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue(null);
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockImplementation(
      (_organizationId: string, userId: string) =>
        userId === "user1" ? { id: "member-actor", role: "owner" } : null
    );

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
        role: "member",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.memberNotFound",
        code: 404,
      },
    });

    expect(mockAddMember).not.toHaveBeenCalled();
  });

  it("rejects non-owner attempts to directly add an owner before calling Better Auth", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "admin",
    });

    await expect(
      addWorkspaceMember({
        organizationId: "org1",
        userId: "user2",
        role: "owner",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.workspaceRolePermissionDenied",
        code: 403,
      },
    });

    expect(mockAddMember).not.toHaveBeenCalled();
  });

  it("updates another member role through Better Auth when the row is editable", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "owner",
      userId: "user1",
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockMemberFindFirst.mockResolvedValue({
      id: "member2",
      organizationId: "org1",
      userId: "user2",
      role: "member",
    });
    mockUpdateMemberRole.mockResolvedValue({
      id: "member2",
      organizationId: "org1",
      userId: "user2",
      role: "admin",
    });

    await expect(
      updateWorkspaceMemberRole({
        organizationId: "org1",
        memberId: "member2",
        role: "admin",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        organizationId: "org1",
        memberId: "member2",
        role: "admin",
      },
    });

    expect(mockUpdateMemberRole).toHaveBeenCalledWith({
      body: {
        organizationId: "org1",
        memberId: "member2",
        role: "admin",
      },
      headers: expect.any(Headers),
    });
  });

  it("rejects non-owner attempts to update a member to owner before calling Better Auth", async () => {
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({ id: "org1" });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue({
      id: "member-actor",
      role: "admin",
      userId: "user1",
    });
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockMemberFindFirst.mockResolvedValue({
      id: "member2",
      organizationId: "org1",
      userId: "user2",
      role: "member",
    });

    await expect(
      updateWorkspaceMemberRole({
        organizationId: "org1",
        memberId: "member2",
        role: "owner",
      })
    ).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.workspaceRolePermissionDenied",
        code: 403,
      },
    });

    expect(mockUpdateMemberRole).not.toHaveBeenCalled();
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
    mockSetActiveOrganization.mockResolvedValue(undefined);
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: "org1",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: null,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    });

    const result = await acceptWorkspaceInvitation({ invitationId: "invite1" });

    expect(mockAcceptInvitation).toHaveBeenCalledWith({
      body: {
        invitationId: "invite1",
      },
      headers: expect.any(Headers),
    });
    expect(mockSetActiveOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: "org1",
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

  it("rejects invitation acceptance when the decision loader marks it as domain-restricted", async () => {
    mockLoadWorkspaceInvitationDecisionPageContext.mockResolvedValue({
      invitation: {
        id: "invite1",
        organizationId: "org1",
        email: "alice@outside.test",
      },
      state: "domain-restricted",
      canRespond: false,
    });

    await expect(acceptWorkspaceInvitation({ invitationId: "invite1" })).resolves.toEqual({
      success: false,
      error: {
        message: "validation.errors.invitationDomainRestricted",
        code: 403,
      },
    });
    expect(mockAcceptInvitation).not.toHaveBeenCalled();
  });
});
