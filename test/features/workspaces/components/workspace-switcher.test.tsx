import "@testing-library/jest-dom";
import { act, render, screen, within } from "@testing-library/react";
import React from "react";
import { WorkspaceSwitcher } from "@features/workspaces/components/ui/workspace-switcher";
import { setActiveOrganization } from "@features/organizations/actions/set-active-organization";

jest.mock("@lib/environment", () => ({
  BOT_AGENTS: /^$/,
}));

const mockUseParams = jest.fn();
const mockUsePathname = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      "workspaces.ui.switcher": {
        fallback: "Workspaces",
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
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock("@features/organizations/actions/set-active-organization", () => ({
  setActiveOrganization: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock("@components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="workspace-switcher-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="workspace-switcher-menu">{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children?: React.ReactNode;
    onSelect?: () => void;
  }) => <button onClick={onSelect}>{children}</button>,
  DropdownMenuSeparator: () => <div />,
}));

jest.mock("@components/ui/badge", () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock("@components/ui/breadcrumb", () => ({
  BreadcrumbItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbSeparator: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbEllipsis: () => <div>...</div>,
}));

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    mockUseParams.mockReset();
    mockUsePathname.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
    (setActiveOrganization as jest.Mock).mockReset();
  });

  it("uses the workspace from the current URL context in the breadcrumb label", async () => {
    mockUseParams.mockReturnValue({ organizationKey: "client-workspace" });

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
              },
              {
                id: "workspace-2",
                name: "Client Workspace",
                slug: "client-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
              },
            ],
          })}
        />
      );
    });

    const trigger = screen.getByTestId("workspace-switcher-trigger");

    expect(within(trigger).getByText("Client Workspace")).toBeInTheDocument();
    expect(within(trigger).queryByText("Default Workspace")).not.toBeInTheDocument();
  });

  it("does not rewrite the active organization while rendering a deep link", async () => {
    mockUseParams.mockReturnValue({ organizationKey: "client-workspace" });

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
              },
              {
                id: "workspace-2",
                name: "Client Workspace",
                slug: "client-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
              },
            ],
          })}
        />
      );
    });

    expect(setActiveOrganization).not.toHaveBeenCalled();
  });

  it("changes the active workspace and preserves a base workspace route", async () => {
    mockUseParams.mockReturnValue({ organizationKey: "default-workspace" });
    mockUsePathname.mockReturnValue("/default-workspace/settings/invitations");
    (setActiveOrganization as jest.Mock).mockResolvedValue({
      success: true,
      data: { organizationId: "workspace-2" },
    });

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
              },
              {
                id: "workspace-2",
                name: "Client Workspace",
                slug: "client-workspace",
                logo: null,
                metadata: null,
                createdAt: new Date("2026-04-20T10:00:00.000Z"),
                updatedAt: new Date("2026-04-20T10:00:00.000Z"),
              },
            ],
          })}
        />
      );
    });

    const menu = screen.getByTestId("workspace-switcher-menu");
    const menuItem = within(menu).getByText("Client Workspace").closest("button");
    expect(menuItem).not.toBeNull();
    expect(menu).toContainElement(menuItem);

    await act(async () => {
      menuItem?.click();
    });

    expect(setActiveOrganization).toHaveBeenCalledWith({ organizationId: "workspace-2" });
    expect(mockPush).toHaveBeenCalledWith("/client-workspace/settings/invitations");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
