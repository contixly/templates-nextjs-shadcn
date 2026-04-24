import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppBreadcrumbsRoutes } from "../../src/components/application/breadcrumbs/app-breadcrumbs-routes";
import { AppBreadcrumbsHome } from "../../src/components/application/breadcrumbs/app-breadcrumbs-home";
import { DocumentHeader } from "../../src/components/application/document/document-header";
import { NavSecondary } from "../../src/components/application/navigation/nav-secondary";
import { NavUserSettings } from "../../src/features/accounts/components/nav/nav-user-settings";

const mockUseCurrentPage = jest.fn();
const mockUsePageTranslations = jest.fn();
const mockUseDocument = jest.fn();
const mockUseIsMobile = jest.fn();
const mockUsePathname = jest.fn();

jest.mock("../../src/hooks/use-current-page", () => ({
  useCurrentPage: (...args: unknown[]) => mockUseCurrentPage(...args),
}));

jest.mock("../../src/hooks/use-page-translations", () => ({
  usePageTranslations: (...args: unknown[]) => mockUsePageTranslations(...args),
}));

jest.mock("../../src/components/application/document/document-provider", () => ({
  useDocument: (...args: unknown[]) => mockUseDocument(...args),
}));

jest.mock("../../src/hooks/use-mobile", () => ({
  useIsMobile: (...args: unknown[]) => mockUseIsMobile(...args),
}));

jest.mock("next/navigation", () => ({
  usePathname: (...args: unknown[]) => mockUsePathname(...args),
}));

jest.mock("../../src/components/application/document/document-sidebar", () => ({
  __esModule: true,
  default: ({ headerName, children }: { headerName?: string; children?: React.ReactNode }) => (
    <div data-testid="document-sidebar" data-header-name={headerName ?? ""}>
      {children}
    </div>
  ),
}));

jest.mock("../../src/components/ui/sidebar", () => ({
  SidebarGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ isMobile: false, toggleSidebar: jest.fn() }),
}));

jest.mock("../../src/features/workspaces/components/ui/workspace-switcher", () => ({
  WorkspaceSwitcher: () => null,
}));

jest.mock("../../src/components/application/breadcrumbs/app-breadcrumbs-page", () => ({
  AppBreadcrumbsPage: () => null,
}));

jest.mock("../../src/components/ui/breadcrumb", () => ({
  BreadcrumbItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BreadcrumbLink: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
  BreadcrumbSeparator: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../src/components/ui/custom/animated-link", () => ({
  __esModule: true,
  default: ({ children, href }: { children?: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "getHelp" ? "Помощь" : key),
}));

jest.mock("../../src/lib/environment", () => ({
  APP_BASE_URL: "https://example.com",
}));

describe("page translation consumers", () => {
  beforeEach(() => {
    mockUseCurrentPage.mockReturnValue({
      featureName: "application",
      pageKey: "home",
      pathTemplate: "/",
      path: () => "/",
      i18n: { namespace: "application.pages.home" },
    });
    mockUsePageTranslations.mockImplementation((page: { pageKey: string }) => {
      if (page.pageKey === "home") {
        return {
          title: "Главная",
          description: "Локализованное описание",
          openGraphTitle: "Главная",
          openGraphDescription: "Локализованное описание",
        };
      }

      if (page.pageKey === "user") {
        return {
          title: "Настройки аккаунта",
          description: "Настройки учетной записи",
          openGraphTitle: "Настройки аккаунта",
          openGraphDescription: "Настройки учетной записи",
        };
      }

      if (page.pageKey === "workspaces") {
        return {
          title: "Рабочие пространства",
          description: "Список рабочих пространств",
          openGraphTitle: "Рабочие пространства",
          openGraphDescription: "Список рабочих пространств",
        };
      }

      return {
        title: "Профиль",
        description: "Настройки учетной записи",
        openGraphTitle: "Профиль",
        openGraphDescription: "Настройки учетной записи",
      };
    });
    mockUseDocument.mockReturnValue({
      title: null,
      description: null,
      documentActions: null,
      category: null,
    });
    mockUseIsMobile.mockReturnValue(false);
    mockUsePathname.mockReturnValue("/user/profile");
  });

  it("renders translated route title and description in the document header", () => {
    render(<DocumentHeader />);

    expect(screen.getByText("Главная")).toBeInTheDocument();
    expect(screen.getByText("Локализованное описание")).toBeInTheDocument();
  });

  it("renders translated route title in breadcrumbs home", () => {
    render(<AppBreadcrumbsHome />);

    expect(screen.getByText("Главная")).toBeInTheDocument();
  });

  it("renders translated labels in secondary navigation", () => {
    render(<NavSecondary />);

    expect(screen.getByText("Главная")).toBeInTheDocument();
    expect(screen.getByText("Рабочие пространства")).toBeInTheDocument();
    expect(screen.getByText("Профиль")).toBeInTheDocument();
    expect(screen.getByText("Помощь")).toBeInTheDocument();
  });

  it("renders the translated parent breadcrumb label when the current page has a parent", () => {
    mockUseCurrentPage.mockReturnValue({
      featureName: "accounts",
      pageKey: "profile",
      pathTemplate: "/user/profile",
      path: () => "/user/profile",
      parent: {
        featureName: "accounts",
        pageKey: "user",
        pathTemplate: "/user",
        path: () => "/user",
        i18n: { namespace: "accounts.pages.user" },
      },
      i18n: { namespace: "accounts.pages.profile" },
    });

    render(
      <AppBreadcrumbsRoutes
        loadUserWorkspacesPromise={Promise.resolve({ success: true, data: [] })}
      />
    );

    expect(screen.getByText("Настройки аккаунта")).toBeInTheDocument();
  });

  it("uses the localized account settings header in user settings navigation", () => {
    render(<NavUserSettings />);

    expect(screen.getByTestId("document-sidebar")).toHaveAttribute(
      "data-header-name",
      "Настройки аккаунта"
    );
  });
});
