import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceCard } from "@features/workspaces/components/ui/workspace-card";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      "workspaces.ui.card": {
        default: "Default workspace",
        custom: "Custom workspace",
        slugLabel: "Slug",
        summary: "Workspace summary",
        open: "Open workspace",
      },
    };

    return messages[namespace]?.[key] ?? key;
  },
}));

jest.mock("../../src/components/ui/custom/animated-link", () => ({
  __esModule: true,
  default: ({ children, href }: { children?: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("../../src/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: { children?: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button {...props}>{children}</button>,
}));

jest.mock("../../src/components/ui/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../src/components/ui/skeleton", () => ({
  Skeleton: () => <div />,
}));

jest.mock("../../src/features/workspaces/components/forms/workspace-delete-dialog", () => ({
  WorkspaceDeleteDialog: () => <div data-testid="workspace-delete-dialog" />,
}));

jest.mock("../../src/features/workspaces/components/forms/workspace-settings-dialog", () => ({
  WorkspaceSettingsDialog: () => <div data-testid="workspace-settings-dialog" />,
}));

describe("WorkspaceCard", () => {
  it("renders organization-backed workspace fields using workspace terminology", () => {
    render(
      <WorkspaceCard
        workspace={{
          id: "org-42",
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
          isDefault: false,
        }}
      />
    );

    expect(screen.getByText("Client Workspace")).toBeInTheDocument();
    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.getByText("client-workspace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open workspace" })).toHaveAttribute("href", "/org-42");
  });
});
