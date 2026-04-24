import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { WorkspaceSidebarSwitcher } from "@features/workspaces/components/ui/workspace-sidebar-switcher";
import { setActiveOrganization } from "@features/organizations/actions/set-active-organization";

const mockUseParams = jest.fn();
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
      "workspaces.ui.createDialog": {
        trigger: "Create New Workspace",
      },
    };

    return messages[namespace]?.[key] ?? key;
  },
}));

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
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

jest.mock("@components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
  SidebarMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ isMobile: false, toggleSidebar: jest.fn() }),
}));

jest.mock("@components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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

jest.mock("@components/ui/skeleton", () => ({
  Skeleton: () => <div />,
}));

jest.mock("@features/workspaces/components/forms/workspace-create-dialog", () => ({
  WorkspaceCreateDialog: ({ trigger }: { trigger?: React.ReactNode }) => <div>{trigger}</div>,
}));

describe("WorkspaceSidebarSwitcher", () => {
  beforeEach(() => {
    mockUseParams.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
    (setActiveOrganization as jest.Mock).mockReset();
  });

  it("uses the workspace from the current URL context instead of the first accessible workspace", async () => {
    mockUseParams.mockReturnValue({ organizationKey: "client-workspace" });

    await act(async () => {
      render(
        <WorkspaceSidebarSwitcher
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

    const trigger = screen.getAllByRole("button")[0];

    expect(within(trigger).getByText("Client Workspace")).toBeInTheDocument();
    expect(within(trigger).queryByText("Default Workspace")).not.toBeInTheDocument();
  });

  it("changes the active workspace and navigates to its dashboard when the user selects another workspace", async () => {
    mockUseParams.mockReturnValue({ organizationKey: "default-workspace" });
    (setActiveOrganization as jest.Mock).mockResolvedValue({
      success: true,
      data: { organizationId: "workspace-2" },
    });

    await act(async () => {
      render(
        <WorkspaceSidebarSwitcher
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

    await act(async () => {
      fireEvent.click(menuItem!);
    });

    await waitFor(() => {
      expect(setActiveOrganization).toHaveBeenCalledWith({ organizationId: "workspace-2" });
      expect(mockPush).toHaveBeenCalledWith("/client-workspace/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
