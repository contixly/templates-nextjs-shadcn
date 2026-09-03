import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useSidebar } from "@components/ui/sidebar";
import {
  DocumentsSystemSidebarProvider,
  parseDocumentsSidebarCookie,
} from "@features/documents-system/ui/documents-system-sidebar-provider";

jest.mock("@hooks/use-mobile", () => ({ useIsMobile: () => false }));
jest.mock("@lib/environment", () => ({ SIDEBAR_COOKIE_KEY: "sidebar_state" }));

const SidebarStateProbe = () => {
  const { open, setOpen } = useSidebar();

  return (
    <button data-testid="sidebar-state" onClick={() => setOpen(!open)}>
      {String(open)}
    </button>
  );
};

const clearSidebarStateCookie = () => {
  document.cookie = "sidebar_state=; path=/; max-age=0";
};

describe("parseDocumentsSidebarCookie", () => {
  beforeEach(clearSidebarStateCookie);
  afterEach(clearSidebarStateCookie);

  it.each([
    ["", false],
    ["sidebar_state=false", false],
    ["sidebar_state=broken", false],
    ["other=true", false],
    ["other=false; sidebar_state=true", true],
    [" other=false ;  sidebar_state=true ", true],
    ["sidebar_state=%74rue", true],
    ["sidebar_state=%22true%22", false],
    ["sidebar_state=%E0%A4%A", false],
  ])("parses %s as %s", (cookieHeader, expected) => {
    expect(parseDocumentsSidebarCookie(cookieHeader)).toBe(expected);
  });
});

describe("DocumentsSystemSidebarProvider", () => {
  beforeEach(clearSidebarStateCookie);
  afterEach(clearSidebarStateCookie);

  it("restores true after mounting and persists later toggles", async () => {
    document.cookie = "sidebar_state=true; path=/";
    render(
      <DocumentsSystemSidebarProvider>
        <SidebarStateProbe />
      </DocumentsSystemSidebarProvider>
    );

    await waitFor(() => expect(screen.getByTestId("sidebar-state")).toHaveTextContent("true"));
    fireEvent.click(screen.getByTestId("sidebar-state"));
    expect(screen.getByTestId("sidebar-state")).toHaveTextContent("false");
    expect(document.cookie).toContain("sidebar_state=false");
  });

  it("renders the neutral closed state before effects run", () => {
    document.cookie = "sidebar_state=true; path=/";
    const html = renderToString(
      <DocumentsSystemSidebarProvider>
        <SidebarStateProbe />
      </DocumentsSystemSidebarProvider>
    );

    expect(html).toContain(">false</button>");
  });

  it("hydrates the neutral server state without a mismatch before restoring true", async () => {
    document.cookie = "sidebar_state=true; path=/";
    const html = renderToString(
      <DocumentsSystemSidebarProvider>
        <SidebarStateProbe />
      </DocumentsSystemSidebarProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    try {
      hydrateRoot(
        container,
        <DocumentsSystemSidebarProvider>
          <SidebarStateProbe />
        </DocumentsSystemSidebarProvider>
      );

      await waitFor(() => expect(screen.getByTestId("sidebar-state")).toHaveTextContent("true"));
      expect(
        consoleErrorSpy.mock.calls.some(([message]) =>
          String(message).toLowerCase().includes("hydration")
        )
      ).toBe(false);
    } finally {
      consoleErrorSpy.mockRestore();
      container.remove();
    }
  });
});
