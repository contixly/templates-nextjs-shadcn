import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsPage } from "@features/workspaces/components/pages/workspace-settings-page";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      workspaces: {
        ui: {
          settingsPage: {
            title: "Workspace Settings",
            description: "Update the basic workspace details and default workspace preference.",
            readOnlyNotice:
              "You can review these workspace details, but only admins and owners can update them.",
            dangerZoneTitle: "Delete Workspace",
            dangerZoneDescription:
              "Delete this workspace permanently when the existing product rules allow it.",
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

jest.mock("@features/workspaces/components/forms/workspace-settings-form", () => ({
  WorkspaceSettingsForm: ({
    canUpdateWorkspace,
    canChangeDefault,
  }: {
    canUpdateWorkspace?: boolean;
    canChangeDefault?: boolean;
  }) => (
    <div data-testid="workspace-settings-form">
      {String(canUpdateWorkspace)}:{String(canChangeDefault)}
    </div>
  ),
}));

jest.mock("@features/workspaces/components/forms/workspace-delete-dialog", () => ({
  WorkspaceDeleteDialog: () => <div data-testid="workspace-delete-dialog" />,
}));

describe("WorkspaceSettingsPage", () => {
  const workspace = {
    id: "org-42",
    name: "Client Workspace",
    slug: "client-workspace",
    logo: null,
    metadata: null,
    createdAt: new Date("2026-04-20T10:00:00.000Z"),
    updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    isDefault: false,
  };

  it("renders a read-only notice for members without update permission", () => {
    render(
      <WorkspaceSettingsPage
        workspace={workspace}
        canUpdateWorkspace={false}
        canChangeDefault={false}
      />
    );

    expect(
      screen.getByText(
        "You can review these workspace details, but only admins and owners can update them."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("workspace-settings-form")).toHaveTextContent("false:false");
    expect(screen.queryByTestId("workspace-delete-dialog")).not.toBeInTheDocument();
  });

  it("renders the delete controls only when delete access is available", () => {
    render(
      <WorkspaceSettingsPage
        workspace={workspace}
        canUpdateWorkspace
        canChangeDefault
        canDeleteWorkspace
      />
    );

    expect(screen.getByText("Delete Workspace")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Delete this workspace permanently when the existing product rules allow it."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("workspace-delete-dialog")).toBeInTheDocument();
  });
});
