/** @jest-environment node */

const mockLoadCurrentUser = jest.fn();
const mockLoadCurrentUserId = jest.fn();
const mockFindManyAccessibleOrganizationsByUserId = jest.fn();
const mockFindOrganizationMemberByOrganizationIdAndUserId = jest.fn();
const mockFindManyPendingWorkspaceInvitationsByEmail = jest.fn();
const mockFindWorkspaceInvitationById = jest.fn();
const mockFindWorkspaceInvitationDomainRestrictionContext = jest.fn();
const mockFindManyWorkspaceInvitationsByOrganizationIdAndUserId = jest.fn();
const mockHasWorkspacePermission = jest.fn();
const mockLoadWorkspaceSettingsPageContext = jest.fn();

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUser: (...args: unknown[]) => mockLoadCurrentUser(...args),
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  findManyAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    mockFindManyAccessibleOrganizationsByUserId(...args),
  findOrganizationMemberByOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindOrganizationMemberByOrganizationIdAndUserId(...args),
}));

jest.mock("@features/workspaces/workspaces-invitations-repository", () => ({
  findManyPendingWorkspaceInvitationsByEmail: (...args: unknown[]) =>
    mockFindManyPendingWorkspaceInvitationsByEmail(...args),
  findWorkspaceInvitationById: (...args: unknown[]) => mockFindWorkspaceInvitationById(...args),
  findWorkspaceInvitationDomainRestrictionContext: (...args: unknown[]) =>
    mockFindWorkspaceInvitationDomainRestrictionContext(...args),
  findManyWorkspaceInvitationsByOrganizationIdAndUserId: (...args: unknown[]) =>
    mockFindManyWorkspaceInvitationsByOrganizationIdAndUserId(...args),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => mockHasWorkspacePermission(...args),
}));

jest.mock("@features/workspaces/workspaces-settings", () => ({
  loadWorkspaceSettingsPageContext: (...args: unknown[]) =>
    mockLoadWorkspaceSettingsPageContext(...args),
}));

jest.mock("@lib/environment", () => ({
  APP_BASE_URL: "https://example.com",
}));

jest.mock("next/navigation", () => ({
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import {
  loadCurrentUserPendingWorkspaceInvitations,
  loadWorkspaceInvitationDecisionPageContext,
  loadWorkspaceSettingsInvitationsPageContext,
} from "@features/workspaces/workspaces-invitations";

describe("workspace invitation loaders", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-24T12:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockLoadCurrentUser.mockReset();
    mockLoadCurrentUserId.mockReset();
    mockFindManyAccessibleOrganizationsByUserId.mockReset();
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockReset();
    mockFindManyPendingWorkspaceInvitationsByEmail.mockReset();
    mockFindWorkspaceInvitationById.mockReset();
    mockFindWorkspaceInvitationDomainRestrictionContext.mockReset();
    mockFindManyWorkspaceInvitationsByOrganizationIdAndUserId.mockReset();
    mockHasWorkspacePermission.mockReset();
    mockLoadWorkspaceSettingsPageContext.mockReset();
  });

  it("filters out expired and already-accessible invitations from the current-user list", async () => {
    mockLoadCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      emailVerified: true,
    });
    mockFindManyAccessibleOrganizationsByUserId.mockResolvedValue([{ id: "org-2" }]);
    mockFindManyPendingWorkspaceInvitationsByEmail.mockResolvedValue([
      {
        id: "invite-1",
        organizationId: "org-1",
        organizationName: "Acme",
        organizationSlug: "acme",
        email: "alice@example.com",
        role: "member",
        roleLabels: ["member"],
        status: "pending",
        displayStatus: "pending",
        expiresAt: new Date("2026-04-25T10:00:00.000Z"),
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        inviterId: "user-2",
        inviterName: "Inviter",
        inviterEmail: "inviter@example.com",
        invitationUrl: "https://example.com/invite/invite-1",
      },
      {
        id: "invite-2",
        organizationId: "org-2",
        organizationName: "Beta",
        organizationSlug: "beta",
        email: "alice@example.com",
        role: "member",
        roleLabels: ["member"],
        status: "pending",
        displayStatus: "pending",
        expiresAt: new Date("2026-04-25T10:00:00.000Z"),
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        inviterId: "user-2",
        inviterName: "Inviter",
        inviterEmail: "inviter@example.com",
        invitationUrl: "https://example.com/invite/invite-2",
      },
      {
        id: "invite-3",
        organizationId: "org-3",
        organizationName: "Gamma",
        organizationSlug: "gamma",
        email: "alice@example.com",
        role: "member",
        roleLabels: ["member"],
        status: "pending",
        displayStatus: "pending",
        expiresAt: new Date("2026-04-20T09:00:00.000Z"),
        createdAt: new Date("2026-04-20T08:00:00.000Z"),
        inviterId: "user-2",
        inviterName: "Inviter",
        inviterEmail: "inviter@example.com",
        invitationUrl: "https://example.com/invite/invite-3",
      },
    ]);

    const invitations = await loadCurrentUserPendingWorkspaceInvitations();

    expect(invitations).toHaveLength(1);
    expect(invitations[0]?.id).toBe("invite-1");
  });

  it("derives the email verification gate for invitation decisions", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-1");
    mockLoadCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      emailVerified: false,
    });
    mockFindWorkspaceInvitationById.mockResolvedValue({
      id: "invite-1",
      organizationId: "org-1",
      organizationName: "Acme",
      organizationSlug: "acme",
      email: "alice@example.com",
      role: "member",
      roleLabels: ["member"],
      status: "pending",
      displayStatus: "pending",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      inviterId: "user-2",
      inviterName: "Inviter",
      inviterEmail: "inviter@example.com",
      invitationUrl: "https://example.com/invite/invite-1",
    });
    mockFindOrganizationMemberByOrganizationIdAndUserId.mockResolvedValue(null);

    await expect(loadWorkspaceInvitationDecisionPageContext("invite-1")).resolves.toMatchObject({
      state: "email-verification-required",
      canRespond: false,
    });
  });

  it("returns a recipient mismatch state without exposing invitation details", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-1");
    mockLoadCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "bob@example.com",
      emailVerified: true,
    });
    mockFindWorkspaceInvitationById.mockResolvedValue({
      id: "invite-1",
      organizationId: "org-1",
      organizationName: "Acme",
      organizationSlug: "acme",
      email: "alice@example.com",
      role: "member",
      roleLabels: ["member"],
      status: "accepted",
      displayStatus: "accepted",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      inviterId: "user-2",
      inviterName: "Inviter",
      inviterEmail: "inviter@example.com",
      invitationUrl: "https://example.com/invite/invite-1",
    });

    await expect(loadWorkspaceInvitationDecisionPageContext("invite-1")).resolves.toEqual({
      invitation: null,
      state: "recipient-mismatch",
      canRespond: false,
    });
    expect(mockFindOrganizationMemberByOrganizationIdAndUserId).not.toHaveBeenCalled();
  });

  it("returns a domain-restricted state when a pending invitation no longer matches active restrictions", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-1");
    mockLoadCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "alice@outside.test",
      emailVerified: true,
    });
    mockFindWorkspaceInvitationById.mockResolvedValue({
      id: "invite-1",
      organizationId: "org-1",
      organizationName: "Acme",
      organizationSlug: "acme",
      email: "alice@outside.test",
      role: "member",
      roleLabels: ["member"],
      status: "pending",
      displayStatus: "pending",
      expiresAt: new Date("2026-04-25T10:00:00.000Z"),
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      inviterId: "user-2",
      inviterName: "Inviter",
      inviterEmail: "inviter@example.com",
      invitationUrl: "https://example.com/invite/invite-1",
    });
    mockFindWorkspaceInvitationDomainRestrictionContext.mockResolvedValue({
      organizationId: "org-1",
      email: "alice@outside.test",
      organizationMetadata: {
        allowedEmailDomains: ["example.com"],
      },
    });

    await expect(loadWorkspaceInvitationDecisionPageContext("invite-1")).resolves.toMatchObject({
      invitation: expect.objectContaining({
        id: "invite-1",
      }),
      state: "domain-restricted",
      canRespond: false,
    });
    expect(mockFindOrganizationMemberByOrganizationIdAndUserId).not.toHaveBeenCalled();
  });

  it("loads workspace invitations together with the create permission flag", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-1");
    mockLoadWorkspaceSettingsPageContext.mockResolvedValue({
      workspace: { id: "org-1", slug: "acme" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: true,
      canonicalOrganizationKey: "acme",
      currentMemberRole: "admin",
      assignableWorkspaceRoles: ["member", "admin"],
    });
    mockFindManyWorkspaceInvitationsByOrganizationIdAndUserId.mockResolvedValue([
      {
        id: "invite-1",
        organizationId: "org-1",
        organizationName: "Acme",
        organizationSlug: "acme",
        email: "alice@example.com",
        role: "member",
        roleLabels: ["member"],
        status: "pending",
        displayStatus: "pending",
        expiresAt: new Date("2026-04-25T10:00:00.000Z"),
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        inviterId: "user-2",
        inviterName: "Inviter",
        inviterEmail: "inviter@example.com",
        invitationUrl: "https://example.com/invite/invite-1",
      },
    ]);
    mockHasWorkspacePermission.mockResolvedValue(true);

    await expect(loadWorkspaceSettingsInvitationsPageContext("acme")).resolves.toMatchObject({
      canCreateInvitations: true,
      currentMemberRole: "admin",
      assignableWorkspaceRoles: ["member", "admin"],
      invitations: [expect.objectContaining({ id: "invite-1" })],
    });
  });

  it("rejects the workspace invitations route for members without invitation permissions", async () => {
    mockLoadCurrentUserId.mockResolvedValue("user-1");
    mockLoadWorkspaceSettingsPageContext.mockResolvedValue({
      workspace: { id: "org-1", slug: "acme" },
      canUpdateWorkspace: false,
      canDeleteWorkspace: false,
      canCreateInvitations: false,
      canonicalOrganizationKey: "acme",
      currentMemberRole: "member",
      assignableWorkspaceRoles: [],
    });

    await expect(loadWorkspaceSettingsInvitationsPageContext("acme")).rejects.toThrow("forbidden");
    expect(mockFindManyWorkspaceInvitationsByOrganizationIdAndUserId).not.toHaveBeenCalled();
  });
});
