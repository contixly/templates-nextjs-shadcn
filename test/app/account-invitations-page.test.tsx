import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { loadCurrentUserPendingWorkspaceInvitations } from "@features/workspaces/workspaces-invitations";
import { loadWorkspaceInvitationDecisionPageContext } from "@features/workspaces/workspaces-invitations";

jest.mock("../../src/features/workspaces/workspaces-invitations", () => ({
  loadCurrentUserPendingWorkspaceInvitations: jest.fn(),
  loadWorkspaceInvitationDecisionPageContext: jest.fn(),
}));

jest.mock("../../src/components/application/settings/settings-shell", () => ({
  SettingsContentRail: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-content-rail">{children}</div>
  ),
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

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Invitations" })),
}));

jest.mock("../../src/features/workspaces/components/pending-workspace-invitations-block", () => ({
  PendingWorkspaceInvitationsBlock: ({
    invitations,
    showEmptyState,
  }: {
    invitations: Array<{ id: string }>;
    showEmptyState?: boolean;
  }) => (
    <div data-testid="pending-workspace-invitations-block">
      {String(Boolean(showEmptyState))}:{invitations.length}
    </div>
  ),
}));

jest.mock(
  "../../src/features/workspaces/components/pages/workspace-invitation-decision-page",
  () => ({
    WorkspaceInvitationDecisionPage: ({ context }: { context: { state: string } }) => (
      <div data-testid="workspace-invitation-decision-page">{context.state}</div>
    ),
  })
);

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("not-found");
  }),
}));

describe("account invitation routes", () => {
  beforeEach(() => {
    (loadCurrentUserPendingWorkspaceInvitations as jest.Mock).mockReset();
    (loadWorkspaceInvitationDecisionPageContext as jest.Mock).mockReset();
  });

  it("renders the personal invitations page with the reusable block", async () => {
    (loadCurrentUserPendingWorkspaceInvitations as jest.Mock).mockResolvedValue([
      { id: "invite-1" },
      { id: "invite-2" },
    ]);

    const pageModule = await import("../../src/app/(protected)/(global)/user/invitations/page");
    const element = await pageModule.default();

    render(element);

    expect(screen.getByTestId("pending-workspace-invitations-block")).toHaveTextContent("true:2");
  });

  it("renders the invitation decision route when context exists", async () => {
    (loadWorkspaceInvitationDecisionPageContext as jest.Mock).mockResolvedValue({
      state: "pending",
    });

    const pageModule =
      await import("../../src/app/(protected)/(global)/invite/[invitationId]/page");
    const element = await pageModule.default({
      params: Promise.resolve({ invitationId: "invite-1" }),
    });

    render(element);

    expect(screen.getByTestId("settings-content-rail")).toBeInTheDocument();
    expect(screen.getByTestId("settings-page-section")).toHaveAttribute("data-mode", "readable");
    expect(screen.getByTestId("workspace-invitation-decision-page")).toHaveTextContent("pending");
  });

  it("throws notFound when the invitation decision context is missing", async () => {
    (loadWorkspaceInvitationDecisionPageContext as jest.Mock).mockResolvedValue(null);

    const pageModule =
      await import("../../src/app/(protected)/(global)/invite/[invitationId]/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ invitationId: "invite-1" }),
      })
    ).rejects.toThrow("not-found");
  });
});
