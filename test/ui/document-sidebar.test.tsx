import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import DocumentSidebar from "../../src/components/application/document/document-sidebar";
import { DocumentProvider } from "../../src/components/application/document/document-provider";

function mockDesktopViewport() {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1280,
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      media: "(max-width: 767px)",
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe("DocumentSidebar", () => {
  beforeEach(() => {
    mockDesktopViewport();
  });

  it("renders a labelled search input with the UI copy used by the notes sidebar", () => {
    const TestSidebar = () => {
      const searchQueryState = React.useState("");

      return (
        <DocumentProvider>
          <DocumentSidebar
            headerName="Workspace Notes"
            searchQueryState={searchQueryState}
            searchQueryPlaceholder="Search notes…"
            searchAriaLabel="Search notes"
          >
            <div>Sidebar content</div>
          </DocumentSidebar>
        </DocumentProvider>
      );
    };

    render(<TestSidebar />);

    expect(screen.getByRole("textbox", { name: "Search notes" })).toHaveAttribute(
      "placeholder",
      "Search notes…"
    );
  });
});
