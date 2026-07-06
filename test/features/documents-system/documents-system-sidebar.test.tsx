import { render, screen, waitFor } from "@testing-library/react";
import { SidebarProvider } from "@components/ui/sidebar";
import { DocumentsSystemSidebar } from "@features/documents-system/ui/documents-system-sidebar";
import type { DocumentsSystemSidebarGroup } from "@features/documents-system/documents-system-types";

let currentPathname = "/docs/general/quick-start";

jest.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@hooks/use-mobile", () => ({
  useIsMobile: () => false,
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

describe("DocumentsSystemSidebar", () => {
  beforeEach(() => {
    currentPathname = "/docs/general/quick-start";
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
});
