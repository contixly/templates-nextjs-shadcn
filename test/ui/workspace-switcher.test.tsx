import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSwitcher } from "@features/workspaces/components/ui/workspace-switcher";
import { setActiveOrganization } from "@features/organizations/actions/set-active-organization";

const mockUseParams = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      "workspaces.ui.switcher": {
        fallback: "Workspaces",
        defaultBadge: "Default",
        myWorkspaces: "My Workspaces",
        manageWorkspaces: "Manage Workspaces",
        switchError: "Unable to switch workspaces right now.",
      },
    };

    return messages[namespace]?.[key] ?? key;
  },
}));

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("../../src/features/organizations/actions/set-active-organization", () => ({
  setActiveOrganization: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock("../../src/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: () => null,
  DropdownMenuLabel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

jest.mock("../../src/components/ui/badge", () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock("../../src/components/ui/breadcrumb", () => ({
  BreadcrumbItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbSeparator: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbEllipsis: () => <div>...</div>,
}));

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    mockUseParams.mockReset();
    (setActiveOrganization as jest.Mock).mockReset();
  });

  it("uses the workspace from the current URL context in the breadcrumb label", async () => {
    mockUseParams.mockReturnValue({ organizationId: "workspace-2" });

    await act(async () => {
      render(
        <WorkspaceSwitcher
          loadUserWorkspacesPromise={Promise.resolve({
            success: true,
            data: [
              {
                id: "workspace-1",
                name: "Default Workspace",
                slug: "default-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
                isDefault: true,
              },
              {
                id: "workspace-2",
                name: "Client Workspace",
                slug: "client-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
                isDefault: false,
              },
            ],
          })}
        />
      );
    });

    expect(screen.getByText("Client Workspace")).toBeInTheDocument();
    expect(screen.queryByText("Default Workspace")).not.toBeInTheDocument();
  });

  it("does not rewrite the active organization while rendering a deep link", async () => {
    mockUseParams.mockReturnValue({ organizationId: "workspace-2" });

    await act(async () => {
      render(
        <WorkspaceSwitcher
          loadUserWorkspacesPromise={Promise.resolve({
            success: true,
            data: [
              {
                id: "workspace-1",
                name: "Default Workspace",
                slug: "default-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
                isDefault: true,
              },
              {
                id: "workspace-2",
                name: "Client Workspace",
                slug: "client-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
                isDefault: false,
              },
            ],
          })}
        />
      );
    });

    expect(setActiveOrganization).not.toHaveBeenCalled();
  });
});
