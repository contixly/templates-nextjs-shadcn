import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import {
  loadWorkspaceSettingsPageContext,
  loadWorkspaceSettingsTeamsPageContext,
  loadWorkspaceSettingsUsersPageContext,
} from "@features/workspaces/workspaces-settings";
import { loadWorkspaceSettingsInvitationsPageContext as loadWorkspaceInvitationsContext } from "@features/workspaces/workspaces-invitations";

const mockWorkspaceSettingsTeamsPage = jest.fn();

jest.mock("@features/workspaces/workspaces-settings", () => ({
  loadWorkspaceSettingsPageContext: jest.fn(),
  loadWorkspaceSettingsTeamsPageContext: jest.fn(),
  loadWorkspaceSettingsUsersPageContext: jest.fn(),
}));

jest.mock("@features/workspaces/workspaces-invitations", () => ({
  loadWorkspaceSettingsInvitationsPageContext: jest.fn(),
}));

jest.mock("@components/application/settings/settings-shell", () => ({
  SettingsPageSection: ({
    mode,
    children,
  }: {
    mode: "wide" | "readable";
    children: React.ReactNode;
  }) => (
    <div data-testid="settings-page-section" data-mode={mode}>
      {children}
    </div>
  ),
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-invitations-page", () => ({
  WorkspaceSettingsInvitationsPage: ({
    invitations,
    canCreateInvitations,
    teams,
  }: {
    invitations: Array<{ id: string }>;
    canCreateInvitations: boolean;
    teams: Array<{ id: string }>;
  }) => (
    <div data-testid="workspace-settings-invitations-page">
      {String(canCreateInvitations)}:{invitations.length}:{teams.length}
    </div>
  ),
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-page", () => ({
  WorkspaceSettingsPage: () => null,
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-placeholder-page", () => ({
  WorkspaceSettingsPlaceholderPage: ({ section }: { section: string }) => (
    <div data-testid="workspace-settings-placeholder-page">{section}</div>
  ),
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-users-page", () => ({
  WorkspaceSettingsUsersPage: ({
    members,
    currentUserId,
  }: {
    members: Array<{ id: string }>;
    currentUserId: string;
  }) => (
    <div data-testid="workspace-settings-users-page">
      {currentUserId}:{members.length}
    </div>
  ),
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-teams-page", () => ({
  WorkspaceSettingsTeamsPage: (props: { teams: Array<{ id: string }> }) => {
    mockWorkspaceSettingsTeamsPage(props);

    return <div data-testid="workspace-settings-teams-page">teams:{props.teams.length}</div>;
  },
}));

jest.mock("@lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Workspace Settings" })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

describe("workspace settings root route", () => {
  beforeEach(() => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsTeamsPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsUsersPageContext as jest.Mock).mockReset();
    (loadWorkspaceInvitationsContext as jest.Mock).mockReset();
    mockWorkspaceSettingsTeamsPage.mockReset();
  });

  it("redirects the settings root to the canonical workspace settings section", async () => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: true,
      canonicalOrganizationKey: "client-workspace",
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ organizationKey: "workspace-123" }),
      })
    ).rejects.toThrow(
      `redirect:${workspaceRoutes.pages.settings_workspace.path({
        organizationKey: "client-workspace",
      })}`
    );
  });
});

describe("workspace settings section routes", () => {
  beforeEach(() => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsTeamsPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsUsersPageContext as jest.Mock).mockReset();
    (loadWorkspaceInvitationsContext as jest.Mock).mockReset();
  });

  it("redirects id-based section urls to the slug-preferred users settings path", async () => {
    (loadWorkspaceSettingsUsersPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: false,
      canonicalOrganizationKey: "client-workspace",
      currentUserId: "user-123",
      members: [],
      canAddMembers: false,
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/users/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ organizationKey: "workspace-123" }),
      })
    ).rejects.toThrow(
      `redirect:${workspaceRoutes.pages.settings_users.path({
        organizationKey: "client-workspace",
      })}`
    );
  });

  it("renders the dedicated workspace users page for canonical section urls", async () => {
    (loadWorkspaceSettingsUsersPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: false,
      canonicalOrganizationKey: "client-workspace",
      currentUserId: "user-123",
      members: [
        {
          id: "member-1",
          userId: "user-123",
          name: "Alice Adams",
          email: "alice@example.com",
          image: null,
          roleLabels: ["owner"],
          joinedAt: new Date("2026-04-20T10:00:00.000Z"),
        },
      ],
      canAddMembers: true,
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/users/page");

    const element = await pageModule.default({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
    expect(screen.getByTestId("workspace-settings-users-page")).toHaveTextContent("user-123:1");
  });

  it("renders the dedicated workspace invitations page for canonical section urls", async () => {
    (loadWorkspaceInvitationsContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canonicalOrganizationKey: "client-workspace",
      invitations: [
        {
          id: "invite-1",
        },
      ],
      teams: [{ id: "team-1" }],
      canCreateInvitations: true,
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/invitations/page");

    const element = await pageModule.default({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
    expect(screen.getByTestId("workspace-settings-invitations-page")).toHaveTextContent("true:1:1");
  });

  it("renders the workspace settings form page inside a readable section", async () => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: true,
      canonicalOrganizationKey: "client-workspace",
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/workspace/page");
    const element = await pageModule.default({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
  });

  it("renders the roles placeholder inside a readable section", async () => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: true,
      canonicalOrganizationKey: "client-workspace",
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/roles/page");
    const element = await pageModule.default({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
    expect(screen.getByTestId("workspace-settings-placeholder-page")).toHaveTextContent("roles");
  });

  it("renders the implemented workspace teams page for canonical section urls", async () => {
    (loadWorkspaceSettingsTeamsPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canUpdateWorkspace: true,
      canDeleteWorkspace: false,
      canCreateInvitations: true,
      canonicalOrganizationKey: "client-workspace",
      teams: [{ id: "team-1" }],
      teamMembersByTeamId: {},
      assignableMembers: [],
      canCreateTeams: true,
      canUpdateTeams: true,
      canDeleteTeams: true,
      canAddTeamMembers: true,
      canRemoveTeamMembers: true,
    });

    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/teams/page");
    const element = await pageModule.default({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
    expect(screen.getByTestId("workspace-settings-teams-page")).toHaveTextContent("teams:1");
    const teamsPageProps = mockWorkspaceSettingsTeamsPage.mock.calls[0]?.[0];
    expect(teamsPageProps).not.toHaveProperty("activeTeamId");
    expect(teamsPageProps).not.toHaveProperty("currentUserId");
  });
});
