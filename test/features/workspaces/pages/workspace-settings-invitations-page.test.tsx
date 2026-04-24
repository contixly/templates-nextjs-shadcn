import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsInvitationsPage } from "@features/workspaces/components/pages/workspace-settings-invitations-page";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      common: {
        words: {
          verbs: {
            copy: "Copy",
          },
        },
      },
      workspaces: {
        pages: {
          settings_invitations: {
            title: "Invitations",
            description: "Create workspace invitations and review invitation activity.",
          },
        },
        ui: {
          settingsInvitationsPage: {
            sectionTitle: "Invitation activity",
            sectionDescription: "Create invitation links and track every invitation state.",
            emptyTitle: "No invitations yet",
            emptyDescription: "Create an invitation to get started.",
            copied: "Copied",
            status: {
              pending: "Pending",
              accepted: "Accepted",
              rejected: "Rejected",
              canceled: "Canceled",
              expired: "Expired",
            },
            table: {
              columns: {
                email: "Email",
                role: "Role",
                inviter: "Inviter",
                created: "Created",
                expires: "Expires",
                status: "Status",
                actions: "Actions",
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

jest.mock("@lib/time", () => ({
  timeTools: {
    formatDate: (date: Date | string) => `formatted:${new Date(date).toISOString()}`,
  },
}));

jest.mock("@features/workspaces/components/forms/workspace-create-invitation-dialog", () => ({
  WorkspaceCreateInvitationDialog: ({
    organizationId,
    assignableRoles,
  }: {
    organizationId: string;
    assignableRoles: string[];
  }) => (
    <div data-testid="workspace-create-invitation-dialog">
      {organizationId}:{assignableRoles.join(",")}
    </div>
  ),
}));

describe("WorkspaceSettingsInvitationsPage", () => {
  it("renders invitation rows together with the invite-by-email control", () => {
    const { container } = render(
      <WorkspaceSettingsInvitationsPage
        organizationId="org-1"
        canCreateInvitations
        assignableWorkspaceRoles={["member", "admin"]}
        invitations={[
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
            inviterId: "user-1",
            inviterName: "Alice Admin",
            inviterEmail: "admin@example.com",
            invitationUrl: "https://example.com/invite/invite-1",
          },
        ]}
      />
    );

    expect(container.firstElementChild).toHaveAttribute("data-slot", "settings-page-intro");
    expect(screen.getByRole("heading", { level: 1, name: "Invitations" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Invitation activity" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("workspace-create-invitation-dialog")).toHaveTextContent(
      "org-1:member,admin"
    );
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Alice Admin")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-20T10:00:00.000Z")).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-25T10:00:00.000Z")).toBeInTheDocument();
  });

  it("renders an empty state when the workspace has no invitations", () => {
    const { container } = render(
      <WorkspaceSettingsInvitationsPage
        organizationId="org-1"
        canCreateInvitations={false}
        assignableWorkspaceRoles={[]}
        invitations={[]}
      />
    );

    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(1);
    expect(screen.getByText("No invitations yet")).toBeInTheDocument();
    expect(screen.getByText("Create an invitation to get started.")).toBeInTheDocument();
  });
});
