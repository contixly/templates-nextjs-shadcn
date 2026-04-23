import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";

const mockUsePathname = jest.fn();
const mockUsePageTranslations = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: (...args: unknown[]) => mockUsePathname(...args),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children?: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@hooks/use-page-translations", () => ({
  usePageTranslations: (...args: unknown[]) => mockUsePageTranslations(...args),
}));

jest.mock("@components/application/document/document-sidebar", () => ({
  __esModule: true,
  default: ({ headerName, children }: { headerName?: string; children?: React.ReactNode }) => (
    <div data-testid="document-sidebar" data-header-name={headerName ?? ""}>
      {children}
    </div>
  ),
}));

jest.mock("@components/ui/sidebar", () => ({
  SidebarMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    children,
    isActive,
  }: {
    children?: React.ReactNode;
    isActive?: boolean;
  }) => <div data-active={isActive ? "true" : "false"}>{children}</div>,
}));

describe("NavWorkspaceSettings", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/acme/settings/users");
    mockUsePageTranslations.mockImplementation((page: { pageKey: string }) => {
      const titles: Record<string, string> = {
        settings: "Настройки рабочего пространства",
        settings_workspace: "Настройки рабочего пространства",
        settings_invitations: "Приглашения",
        settings_users: "Пользователи",
        settings_teams: "Команды",
        settings_roles: "Роли",
      };

      return {
        title: titles[page.pageKey] ?? page.pageKey,
        description: "",
        openGraphTitle: titles[page.pageKey] ?? page.pageKey,
        openGraphDescription: "",
      };
    });
  });

  it("uses localized labels and marks the active section from the current route", () => {
    render(<NavWorkspaceSettings organizationKey="acme" canCreateInvitations />);

    expect(screen.getByTestId("document-sidebar")).toHaveAttribute(
      "data-header-name",
      "Настройки рабочего пространства"
    );
    expect(screen.getByRole("link", { name: "Пользователи" })).toHaveAttribute(
      "href",
      "/acme/settings/users"
    );
    expect(
      screen.getByRole("link", { name: "Пользователи" }).closest("[data-active='true']")
    ).not.toBeNull();
  });

  it("hides the invitations section when the acting member cannot manage invitations", () => {
    render(<NavWorkspaceSettings organizationKey="acme" canCreateInvitations={false} />);

    expect(screen.queryByRole("link", { name: "Приглашения" })).not.toBeInTheDocument();
  });
});
