import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsUsersPage } from "@features/workspaces/components/pages/workspace-settings-users-page";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      workspaces: {
        ui: {
          settingsUsersPage: {
            title: "Workspace Users",
            description: "Review workspace users",
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
                joined: "Joined",
              },
              noRoles: "No roles",
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

jest.mock("../../src/lib/time", () => ({
  timeTools: {
    formatDate: (date: Date | string) => `formatted:${new Date(date).toISOString()}`,
  },
}));

describe("WorkspaceSettingsUsersPage", () => {
  it("renders the current user separately and other members inside a table", () => {
    render(
      <WorkspaceSettingsUsersPage
        currentUserId="user-123"
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
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("billing")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-20T10:00:00.000Z")).toBeInTheDocument();

    expect(screen.getByLabelText("Other workspace users")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "User" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Joined" })).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText("formatted:2026-04-21T10:00:00.000Z")).toBeInTheDocument();
  });

  it("renders an explicit empty state instead of the placeholder copy", () => {
    render(<WorkspaceSettingsUsersPage currentUserId="user-123" members={[]} />);

    expect(screen.getByText("No workspace users yet")).toBeInTheDocument();
    expect(
      screen.getByText("This workspace does not have any visible members yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps the current user outside the table and shows a separate empty state for other users", () => {
    render(
      <WorkspaceSettingsUsersPage
        currentUserId="user-123"
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
