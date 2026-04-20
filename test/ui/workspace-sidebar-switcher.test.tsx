import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSidebarSwitcher } from "../../src/features/workspaces/components/ui/workspace-sidebar-switcher";

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

jest.mock("../../src/components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
  SidebarMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ isMobile: false, toggleSidebar: jest.fn() }),
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

jest.mock("../../src/components/ui/skeleton", () => ({
  Skeleton: () => <div />,
}));

jest.mock("../../src/features/workspaces/components/forms/workspace-create-dialog", () => ({
  WorkspaceCreateDialog: ({ trigger }: { trigger?: React.ReactNode }) => <div>{trigger}</div>,
}));

describe("WorkspaceSidebarSwitcher", () => {
  it("uses the workspace from the current URL context instead of the default workspace", async () => {
    mockUseParams.mockReturnValue({ organizationId: "workspace-2" });

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
});
