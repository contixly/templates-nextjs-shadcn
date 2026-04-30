import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { NavMain } from "@components/application/navigation/nav-main";

const mockUseParams = jest.fn();
const mockSetOpenMobile = jest.fn();
const mockToggleSidebar = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "dashboard" ? "Dashboard" : key),
}));

jest.mock("@components/ui/sidebar", () => ({
  SidebarGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    asChild,
    children,
    ...props
  }: {
    asChild?: boolean;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, props);
    }

    return <button {...props}>{children}</button>;
  },
  useSidebar: () => ({
    isMobile: true,
    setOpenMobile: mockSetOpenMobile,
    toggleSidebar: mockToggleSidebar,
  }),
}));

jest.mock("@components/ui/custom/animated-link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    onClick,
    onNavigate,
    ...props
  }: {
    children?: React.ReactNode;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
        onNavigate?.({ preventDefault: jest.fn() });
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

jest.mock("@features/workspaces/components/forms/workspace-create-dialog", () => ({
  WorkspaceCreateDialog: ({ trigger }: { trigger?: React.ReactNode }) => <>{trigger}</>,
}));

describe("NavMain", () => {
  beforeEach(() => {
    mockUseParams.mockReset();
    mockSetOpenMobile.mockReset();
    mockToggleSidebar.mockReset();
  });

  it("closes the mobile sidebar explicitly when navigating to the workspace dashboard", () => {
    mockUseParams.mockReturnValue({ organizationKey: "acme" });

    render(<NavMain />);

    fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));

    expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });
});
