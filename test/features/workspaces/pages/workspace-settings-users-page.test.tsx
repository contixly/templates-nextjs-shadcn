import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsUsersPage } from "@features/workspaces/components/pages/workspace-settings-users-page";

jest.mock("@features/workspaces/components/forms/workspace-add-member-dialog", () => ({
  WorkspaceAddMemberDialog: ({
    trigger,
    assignableRoles,
  }: {
    trigger?: React.ReactNode;
    assignableRoles: string[];
  }) => (
    <div data-testid="workspace-add-member-dialog">
      {trigger}
      <span>{assignableRoles.join(",")}</span>
    </div>
  ),
}));

jest.mock("@features/workspaces/actions/update-workspace-member-role", () => ({
  updateWorkspaceMemberRole: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    const messages = {
      workspaces: {
        ui: {
          settingsUsersPage: {
            title: "Workspace Users",
            description: "Review workspace users",
            addMemberAction: "Add Member",
            readOnlyNotice:
              "You can review workspace members here, but only admins and owners can add people or change roles in this release.",
            currentUserSectionLabel: "Your workspace access",
            currentUserBadge: "You",
            otherUsersSectionLabel: "Other workspace users",
            otherUsersTitle: "Other workspace users",
            otherUsersDescription:
              "People other than you are shown in a table for faster scanning.",
            joinedLabel: "Joined",
            emptyTitle: "No workspace users yet",
            emptyDescription: "This workspace does not have any visible members yet.",
            othersEmptyTitle: "No other workspace users",
            othersEmptyDescription: "You are the only visible member in this workspace right now.",
            table: {
              columns: {
                user: "User",
                email: "Email",
                roles: "Roles",
                roleAction: "Role action",
                joined: "Joined",
              },
              roleSelectLabel: "Role for {name}",
              noRoles: "No roles",
              readOnlyRole: "Read-only",
            },
          },
          roles: {
            labels: {
              member: "Member",
              admin: "Admin",
              owner: "Owner",
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

    if (typeof value !== "string") {
      return path;
    }

    return value.replace("{name}", values?.name ?? "");
  },
}));

jest.mock("@lib/time", () => ({
  timeTools: {
    formatDate: (date: Date | string) => `formatted:${new Date(date).toISOString()}`,
  },
}));

describe("WorkspaceSettingsUsersPage", () => {
  it("renders the current user separately and other members inside a table", () => {
    render(
      <WorkspaceSettingsUsersPage
        organizationId="org-1"
        currentUserId="user-123"
        canAddMembers
        canUpdateMemberRoles
        assignableWorkspaceRoles={["member", "admin", "owner"]}
        members={[
          {
            id: "member-1",
            userId: "user-123",
            name: "Alice Adams",
            email: "alice@example.com",
            image: null,
            roleLabels: ["owner", "billing"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
          {
            id: "member-2",
            userId: "user-456",
            name: "Bob Brown",
            email: "bob@example.com",
            image: null,
            roleLabels: ["member"],
            joinedAt: new Date("2026-04-21T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(screen.getByLabelText("Your workspace access")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-add-member-dialog")).toHaveTextContent("Add Member");
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("billing")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-20T10:00:00.000Z")).toBeInTheDocument();

    expect(screen.getByLabelText("Other workspace users")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "User" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role action" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Joined" })).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
    expect(screen.getByRole("combobox", { name: "Role for Bob Brown" })).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-21T10:00:00.000Z")).toBeInTheDocument();
  });

  it("renders an explicit empty state instead of the placeholder copy", () => {
    render(
      <WorkspaceSettingsUsersPage
        organizationId="org-1"
        currentUserId="user-123"
        canAddMembers={false}
        canUpdateMemberRoles={false}
        assignableWorkspaceRoles={[]}
        members={[]}
      />
    );

    expect(screen.getByText("No workspace users yet")).toBeInTheDocument();
    expect(
      screen.getByText("This workspace does not have any visible members yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders an explicit read-only notice for members without add-member access", () => {
    render(
      <WorkspaceSettingsUsersPage
        organizationId="org-1"
        currentUserId="user-123"
        canAddMembers={false}
        canUpdateMemberRoles={false}
        assignableWorkspaceRoles={[]}
        members={[
          {
            id: "member-1",
            userId: "user-123",
            name: "Alice Adams",
            email: "alice@example.com",
            image: null,
            roleLabels: ["member"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(
      screen.getByText(
        "You can review workspace members here, but only admins and owners can add people or change roles in this release."
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-add-member-dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("keeps the current user outside the table and shows a separate empty state for other users", () => {
    render(
      <WorkspaceSettingsUsersPage
        organizationId="org-1"
        currentUserId="user-123"
        canAddMembers={false}
        canUpdateMemberRoles={false}
        assignableWorkspaceRoles={[]}
        members={[
          {
            id: "member-1",
            userId: "user-123",
            name: "Alice Adams",
            email: "alice@example.com",
            image: null,
            roleLabels: ["owner"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(screen.getByLabelText("Your workspace access")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("No other workspace users")).toBeInTheDocument();
    expect(
      screen.getByText("You are the only visible member in this workspace right now.")
    ).toBeInTheDocument();
  });
});
