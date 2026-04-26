import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
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
        pages: {
          settings_users: {
            title: "Users",
            description: "Review workspace members, roles, and member-management actions.",
          },
        },
        ui: {
          settingsUsersPage: {
            addMemberAction: "Add Member",
            readOnlyNotice:
              "You can review workspace members here, but only admins and owners can add people or change roles in this release.",
            currentUserSectionLabel: "Your workspace access",
            currentUserTitle: "Your access",
            currentUserDescription: "Review your own workspace membership and assigned roles.",
            currentUserBadge: "You",
            otherUsersSectionLabel: "Other workspace users",
            otherUsersTitle: "Other workspace users",
            otherUsersDescription:
              "People other than you are shown in a table for faster scanning.",
            directoryTitle: "Member directory",
            directoryDescription: "Review visible workspace members and invite existing users.",
            joinedLabel: "Joined",
            domainRestrictionWarningTitle: "Members outside allowed domains",
            domainRestrictionWarningDescription:
              "{count} current member(s) are outside this workspace's active email-domain restrictions.",
            outsideAllowedDomainsBadge: "Outside domain policy",
            emptyTitle: "No workspace users yet",
            emptyDescription: "This workspace does not have any visible members yet.",
            othersEmptyTitle: "No other workspace users",
            othersEmptyDescription: "You are the only visible member in this workspace right now.",
            table: {
              columns: {
                user: "User",
                email: "Email",
                roles: "Roles",
                joined: "Joined",
              },
              roleSelectLabel: "Role for {name}",
              noRoles: "No roles",
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

    return value.replace("{name}", values?.name ?? "").replace("{count}", values?.count ?? "");
  },
}));

jest.mock("@lib/time", () => ({
  timeTools: {
    formatDate: (date: Date | string) => `formatted:${new Date(date).toISOString()}`,
  },
}));

describe("WorkspaceSettingsUsersPage", () => {
  it("renders the current user separately and other members inside a table", () => {
    const { container } = render(
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
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["owner", "billing"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
          {
            id: "member-2",
            userId: "user-456",
            name: "Bob Brown",
            email: "bob@example.com",
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["member"],
            joinedAt: new Date("2026-04-21T10:00:00.000Z"),
          },
          {
            id: "member-3",
            userId: "user-789",
            name: "Casey Clark",
            email: "casey@example.com",
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["owner", "billing"],
            joinedAt: new Date("2026-04-22T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(container.firstElementChild).toHaveAttribute("data-slot", "settings-page-intro");
    expect(screen.getByRole("heading", { level: 1, name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Your access" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Other workspace users" })
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(2);
    expect(screen.getByLabelText("Your workspace access")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-add-member-dialog")).toHaveTextContent("Add Member");
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
    expect(screen.getAllByText("billing").length).toBeGreaterThan(0);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-20T10:00:00.000Z")).toBeInTheDocument();

    expect(screen.getByLabelText("Other workspace users")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "User" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Roles" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Role action" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Joined" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
    const bobRow = screen.getByText("Bob Brown").closest("tr");
    expect(bobRow).not.toBeNull();
    expect(
      within(bobRow as HTMLTableRowElement).getByRole("combobox", { name: "Role for Bob Brown" })
    ).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-21T10:00:00.000Z")).toBeInTheDocument();
    expect(screen.getByText("Casey Clark")).toBeInTheDocument();
    expect(screen.getByText("casey@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
    expect(screen.getAllByText("billing").length).toBeGreaterThan(0);
    expect(screen.queryByText("Read-only")).not.toBeInTheDocument();
  });

  it("renders an explicit empty state instead of the placeholder copy", () => {
    const { container } = render(
      <WorkspaceSettingsUsersPage
        organizationId="org-1"
        currentUserId="user-123"
        canAddMembers={false}
        canUpdateMemberRoles={false}
        assignableWorkspaceRoles={[]}
        members={[]}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "Member directory" })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(1);
    expect(screen.getByText("No workspace users yet")).toBeInTheDocument();
    expect(
      screen.getByText("This workspace does not have any visible members yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders an explicit read-only notice for members without add-member access", () => {
    const { container } = render(
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
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["member"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
          {
            id: "member-2",
            userId: "user-456",
            name: "Bob Brown",
            email: "bob@example.com",
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["member"],
            joinedAt: new Date("2026-04-21T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(2);
    expect(
      screen.getByText(
        "You can review workspace members here, but only admins and owners can add people or change roles in this release."
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-add-member-dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Roles" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Role action" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders a page warning and row marker for members outside active domain restrictions", () => {
    render(
      <WorkspaceSettingsUsersPage
        organizationId="org-1"
        currentUserId="user-123"
        canAddMembers
        canUpdateMemberRoles
        assignableWorkspaceRoles={["member", "admin"]}
        members={[
          {
            id: "member-1",
            userId: "user-123",
            name: "Alice Adams",
            email: "alice@example.com",
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["admin"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
          {
            id: "member-2",
            userId: "user-456",
            name: "Bob Brown",
            email: "bob@outside.test",
            emailDomain: "outside.test",
            isOutsideAllowedEmailDomains: true,
            image: null,
            roleLabels: ["member"],
            joinedAt: new Date("2026-04-21T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Members outside allowed domains");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "1 current member(s) are outside this workspace's active email-domain restrictions."
    );
    const bobRow = screen.getByText("Bob Brown").closest("tr");
    expect(bobRow).not.toBeNull();
    expect(
      within(bobRow as HTMLTableRowElement).getByText("Outside domain policy")
    ).toBeInTheDocument();
  });

  it("keeps the current user outside the table and shows a separate empty state for other users", () => {
    const { container } = render(
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
            emailDomain: "example.com",
            isOutsideAllowedEmailDomains: false,
            image: null,
            roleLabels: ["owner"],
            joinedAt: new Date("2026-04-20T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(2);
    expect(screen.getByLabelText("Your workspace access")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("No other workspace users")).toBeInTheDocument();
    expect(
      screen.getByText("You are the only visible member in this workspace right now.")
    ).toBeInTheDocument();
  });
});
