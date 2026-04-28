import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsTeamsPage } from "@features/workspaces/components/pages/workspace-settings-teams-page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    const messages: Record<string, string> = {
      "common.words.verbs.create": "Create",
      "common.words.verbs.save": "Save",
      "common.words.verbs.add": "Add",
      "common.words.verbs.delete": "Delete",
      "common.words.verbs.cancel": "Cancel",
      "workspaces.pages.settings_teams.title": "Teams",
      "workspaces.pages.settings_teams.description": "Manage teams.",
      "workspaces.ui.settingsTeamsPage.sectionTitle": "Workspace teams",
      "workspaces.ui.settingsTeamsPage.sectionDescription": "Manage explicit teams.",
      "workspaces.ui.settingsTeamsPage.readOnlyTitle": "Read-only team access",
      "workspaces.ui.settingsTeamsPage.readOnlyDescription": "You can review teams.",
      "workspaces.ui.settingsTeamsPage.createNameLabel": "Team name",
      "workspaces.ui.settingsTeamsPage.createNamePlaceholder": "Design",
      "workspaces.ui.settingsTeamsPage.createNameHint": "Maximum 50 characters.",
      "workspaces.ui.settingsTeamsPage.emptyTitle": "No teams yet",
      "workspaces.ui.settingsTeamsPage.emptyDescription": "Create a team when needed.",
      "workspaces.ui.settingsTeamsPage.renameNameLabel": "Team name",
      "workspaces.ui.settingsTeamsPage.teamDescription": "Explicit team.",
      "workspaces.ui.settingsTeamsPage.memberCount": `${values?.count ?? "0"} member(s)`,
      "workspaces.ui.settingsTeamsPage.addMemberLabel": "Add team member",
      "workspaces.ui.settingsTeamsPage.addMemberPlaceholder": "Select a workspace member",
      "workspaces.ui.settingsTeamsPage.addMemberHint": "Only existing workspace members.",
      "workspaces.ui.settingsTeamsPage.addMemberEmptyHint": "Everyone is already in this team.",
      "workspaces.ui.settingsTeamsPage.membersEmptyTitle": "No team members",
      "workspaces.ui.settingsTeamsPage.membersEmptyDescription": "Add existing members.",
      "workspaces.ui.settingsTeamsPage.removeMemberAction": "Remove",
      "workspaces.ui.settingsTeamsPage.removeMemberAriaLabel": `Remove ${values?.name ?? ""}`,
      "workspaces.ui.settingsTeamsPage.deleteDialogTitle": `Delete ${values?.name ?? ""}?`,
      "workspaces.ui.settingsTeamsPage.deleteDialogDescription": "Delete this team.",
      "workspaces.ui.settingsTeamsPage.membersTable.columns.user": "User",
      "workspaces.ui.settingsTeamsPage.membersTable.columns.email": "Email",
      "workspaces.ui.settingsTeamsPage.membersTable.columns.role": "Workspace role",
      "workspaces.ui.settingsTeamsPage.membersTable.columns.actions": "Actions",
      "workspaces.ui.settingsTeamsPage.membersTable.noRole": "No role",
    };
    const path = [namespace, key].filter(Boolean).join(".");

    return messages[path] ?? path;
  },
}));

jest.mock("@/src/i18n/use-any-translations", () => ({
  useAnyTranslations: () => (key: string) => key,
}));

jest.mock("@features/workspaces/actions/add-workspace-team-member", () => ({
  addWorkspaceTeamMember: jest.fn(),
}));
jest.mock("@features/workspaces/actions/create-workspace-team", () => ({
  createWorkspaceTeam: jest.fn(),
}));
jest.mock("@features/workspaces/actions/delete-workspace-team", () => ({
  deleteWorkspaceTeam: jest.fn(),
}));
jest.mock("@features/workspaces/actions/remove-workspace-team-member", () => ({
  removeWorkspaceTeamMember: jest.fn(),
}));
jest.mock("@features/workspaces/actions/update-workspace-team", () => ({
  updateWorkspaceTeam: jest.fn(),
}));

const team = {
  id: "team-1",
  organizationId: "org-1",
  name: "Design",
  memberCount: 1,
  createdAt: new Date("2026-04-20T10:00:00.000Z"),
  updatedAt: new Date("2026-04-20T10:00:00.000Z"),
};

const teamMember = {
  id: "membership-1",
  teamId: "team-1",
  userId: "user-1",
  name: "Alice Admin",
  email: "alice@example.com",
  image: null,
  role: "admin",
  roleLabels: ["admin"],
  joinedAt: new Date("2026-04-20T10:00:00.000Z"),
  teamJoinedAt: new Date("2026-04-21T10:00:00.000Z"),
};

const assignableMember = {
  memberId: "member-2",
  userId: "user-2",
  name: "Bob Member",
  email: "bob@example.com",
  image: null,
  role: "member",
  roleLabels: ["member"],
  joinedAt: new Date("2026-04-20T10:00:00.000Z"),
};

describe("WorkspaceSettingsTeamsPage", () => {
  it("renders the empty state and create form for users with create permission", () => {
    render(
      <WorkspaceSettingsTeamsPage
        organizationId="org-1"
        teams={[]}
        teamMembersByTeamId={{}}
        assignableMembers={[]}
        canCreateTeams
        canUpdateTeams={false}
        canDeleteTeams={false}
        canAddTeamMembers={false}
        canRemoveTeamMembers={false}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Teams" })).toBeInTheDocument();
    expect(screen.getByLabelText("Team name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByText("No teams yet")).toBeInTheDocument();
  });

  it("renders teams in read-only mode for members without management permissions", () => {
    render(
      <WorkspaceSettingsTeamsPage
        organizationId="org-1"
        teams={[team]}
        teamMembersByTeamId={{ "team-1": [teamMember] }}
        assignableMembers={[assignableMember]}
        canCreateTeams={false}
        canUpdateTeams={false}
        canDeleteTeams={false}
        canAddTeamMembers={false}
        canRemoveTeamMembers={false}
      />
    );

    expect(screen.getByText("Read-only team access")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("1 member(s)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByText("Add team member")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set active" })).not.toBeInTheDocument();
  });

  it("renders permission-gated team and membership controls without active team controls", () => {
    render(
      <WorkspaceSettingsTeamsPage
        organizationId="org-1"
        teams={[team]}
        teamMembersByTeamId={{ "team-1": [teamMember] }}
        assignableMembers={[teamMember, assignableMember]}
        canCreateTeams
        canUpdateTeams
        canDeleteTeams
        canAddTeamMembers
        canRemoveTeamMembers
      />
    );

    expect(screen.getAllByLabelText("Team name")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByText("Add team member")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set active" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Alice Admin" })).toBeInTheDocument();
  });
});
