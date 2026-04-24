import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

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

jest.mock("@features/accounts/components/user-profile", () => ({
  UserProfile: () => <div data-testid="user-profile">profile</div>,
}));

jest.mock("@features/accounts/components/user-connections", () => ({
  UserConnections: () => <div data-testid="user-connections">connections</div>,
}));

jest.mock("@features/accounts/components/user-sessions", () => ({
  UserSessions: () => <div data-testid="user-sessions">security</div>,
}));

jest.mock("@features/accounts/components/user-dangerous-zone", () => ({
  UserDangerousZone: () => <div data-testid="user-dangerous-zone">danger</div>,
}));

jest.mock("@features/workspaces/components/pending-workspace-invitations-block", () => ({
  PendingWorkspaceInvitationsBlock: () => (
    <div data-testid="pending-workspace-invitations-block">invitations</div>
  ),
}));

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUser: () => Promise.resolve(undefined),
  loadCurrentUserAccounts: () => Promise.resolve([]),
  loadCurrentSession: () => Promise.resolve(null),
  loadCurrentUserSessions: () => Promise.resolve([]),
}));

jest.mock("@features/workspaces/workspaces-invitations", () => ({
  loadCurrentUserPendingWorkspaceInvitations: () => Promise.resolve([]),
}));

jest.mock("@lib/cookies", () => ({
  getFromCookie: () => Promise.resolve(null),
}));

jest.mock("@lib/environment", () => ({
  LAST_LOGIN_METHOD_KEY: "last-login-method",
}));

jest.mock("@lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Settings" })),
}));

describe("user settings route width modes", () => {
  it("wraps profile, connections, security, and danger pages in readable sections", async () => {
    const profilePage = await import("../../../../src/app/(protected)/(global)/user/profile/page");
    const connectionsPage =
      await import("../../../../src/app/(protected)/(global)/user/connections/page");
    const securityPage =
      await import("../../../../src/app/(protected)/(global)/user/security/page");
    const dangerPage = await import("../../../../src/app/(protected)/(global)/user/danger/page");

    const profileElement = await profilePage.default();
    const connectionsElement = await connectionsPage.default();
    const securityElement = await securityPage.default();
    const dangerElement = await dangerPage.default();

    render(
      <div>
        {profileElement}
        {connectionsElement}
        {securityElement}
        {dangerElement}
      </div>
    );

    expect(screen.getAllByTestId("settings-page-section")).toHaveLength(4);
    expect(
      screen
        .getAllByTestId("settings-page-section")
        .every((node) => node.dataset.mode === "readable")
    ).toBe(true);
  });

  it("wraps the personal invitations page in a wide section", async () => {
    const invitationsPage =
      await import("../../../../src/app/(protected)/(global)/user/invitations/page");
    const element = await invitationsPage.default();

    render(element);

    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "wide");
    expect(screen.getByTestId("pending-workspace-invitations-block")).toBeInTheDocument();
  });
});
