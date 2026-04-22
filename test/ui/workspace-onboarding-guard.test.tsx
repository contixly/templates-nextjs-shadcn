import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";

const messages = {
  title: "Create your first workspace",
  description: "Set up a workspace or wait for an invitation.",
  createAction: "Create workspace",
  inviteAction: "Join with invite",
  inviteHint: "Invites are coming soon.",
};

jest.mock("next-intl", () => ({
  useTranslations: () => (key: keyof typeof messages) => messages[key] ?? key,
}));

jest.mock("../../src/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
    title,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    title?: string;
  }) => (
    <button disabled={disabled} title={title}>
      {children}
    </button>
  ),
}));

jest.mock("../../src/components/ui/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../src/features/workspaces/components/forms/workspace-create-dialog", () => ({
  WorkspaceCreateDialog: ({ trigger }: { trigger?: React.ReactNode }) => (
    <div data-testid="workspace-create-dialog">{trigger}</div>
  ),
}));

describe("WorkspaceOnboardingGuard", () => {
  it("renders onboarding actions for creating a workspace and entering future invite flows", async () => {
    render(<WorkspaceOnboardingGuard />);

    expect(
      screen.getByRole("heading", { name: "Create your first workspace" })
    ).toBeInTheDocument();
    expect(screen.getByText("Set up a workspace or wait for an invitation.")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-create-dialog")).toHaveTextContent("Create workspace");
    expect(screen.getByRole("button", { name: "Join with invite" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Join with invite" })).toHaveAttribute(
      "title",
      "Invites are coming soon."
    );
  });
});
