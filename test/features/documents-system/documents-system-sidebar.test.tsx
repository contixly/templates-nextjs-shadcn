import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SidebarProvider, useSidebar } from "@components/ui/sidebar";
import { DocumentsSystemSidebar } from "@features/documents-system/ui/documents-system-sidebar";
import type { DocumentsSystemSidebarGroup } from "@features/documents-system/documents-system-types";
import * as React from "react";

let currentPathname = "/docs/general/quick-start";
let isMobile = false;

jest.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@hooks/use-mobile", () => ({
  useIsMobile: () => isMobile,
}));

const menu: DocumentsSystemSidebarGroup[] = [
  {
    label: "General",
    items: [
      {
        label: "Getting started",
        statusMix: "default",
        items: [
          {
            label: "Quick start",
            href: "/docs/general/quick-start",
            statusTone: "default",
            hiddenInProduction: false,
          },
        ],
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Account overview",
        statusMix: "default",
        items: [
          {
            label: "Profile",
            href: "/docs/account",
            statusTone: "default",
            hiddenInProduction: false,
          },
        ],
      },
    ],
  },
];

const renderSidebar = () => (
  <SidebarProvider>
    <DocumentsSystemSidebar menu={menu} />
  </SidebarProvider>
);

const MobileSidebarStateProbe = () => {
  const { openMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    setOpenMobile(true);
  }, [setOpenMobile]);

  return <output data-testid="mobile-sidebar-state">{String(openMobile)}</output>;
};

describe("DocumentsSystemSidebar", () => {
  beforeEach(() => {
    currentPathname = "/docs/general/quick-start";
    isMobile = false;
  });

  it("opens the parent group for the active document after client-side route changes", async () => {
    const view = render(renderSidebar());

    expect(
      screen.getByRole("button", { name: /Getting started/ }).getAttribute("aria-expanded")
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /Account overview/ }).getAttribute("aria-expanded")
    ).toBe("false");

    currentPathname = "/docs/account";
    view.rerender(renderSidebar());

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Account overview/ }).getAttribute("aria-expanded")
      ).toBe("true")
    );
  });

  it("closes the mobile sidebar when a document link is selected", async () => {
    isMobile = true;

    render(
      <SidebarProvider>
        <MobileSidebarStateProbe />
        <DocumentsSystemSidebar menu={menu} />
      </SidebarProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("mobile-sidebar-state").textContent).toBe("true")
    );

    const link = screen.getByRole("link", { name: /Quick start/ });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);

    await waitFor(() =>
      expect(screen.getByTestId("mobile-sidebar-state").textContent).toBe("false")
    );
  });
});
