import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceInvitationDecisionPage } from "@features/workspaces/components/pages/workspace-invitation-decision-page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      workspaces: {
        ui: {
          invitationDecisionPage: {
            title: "Workspace Invitation",
            viewInvitationsAction: "View My Invitations",
            details: {
              workspace: "Workspace",
              email: "Invited email",
              role: "Role",
              inviter: "Invited by",
              created: "Created",
              expires: "Expires",
            },
            state: {
              "domain-restricted": {
                label: "Domain restricted",
                description:
                  "This invitation can no longer be accepted because the invited email domain is outside the workspace's active restrictions.",
              },
            },
          },
        },
      },
    };

    const path = [namespace, key].filter(Boolean).join(".");
    const value = path.split(".").reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === "object" && segment in acc) {
        return (acc as Record<string, unknown>)[segment];
      }

      return path;
    }, messages);

    return typeof value === "string" ? value : path;
  },
}));

jest.mock("@/src/i18n/use-any-translations", () => ({
  useAnyTranslations: () => (key: string) => key,
}));

jest.mock("@features/workspaces/actions/accept-workspace-invitation", () => ({
  acceptWorkspaceInvitation: jest.fn(),
}));

jest.mock("@features/workspaces/actions/reject-workspace-invitation", () => ({
  rejectWorkspaceInvitation: jest.fn(),
}));

jest.mock("@lib/time", () => ({
  timeTools: {
    formatDate: (date: Date | string) => `formatted:${new Date(date).toISOString()}`,
  },
}));

describe("WorkspaceInvitationDecisionPage", () => {
  it("renders the domain-restricted state without response actions", () => {
    render(
      <WorkspaceInvitationDecisionPage
        context={{
          state: "domain-restricted",
          canRespond: false,
          invitation: {
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
          },
        }}
      />
    );

    expect(screen.getByText("Domain restricted")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This invitation can no longer be accepted because the invited email domain is outside the workspace's active restrictions."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept Invitation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject Invitation" })).not.toBeInTheDocument();
  });
});
