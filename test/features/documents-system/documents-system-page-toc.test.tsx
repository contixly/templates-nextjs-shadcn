import { render, waitFor } from "@testing-library/react";
import { DocumentsSystemPageToc } from "@features/documents-system/ui/page/documents-system-page-toc";

const useDocumentsSystemActiveHeadingMock = jest.fn(() => "");

jest.mock("@features/documents-system/ui/page/documents-system-page-menu", () => ({
  DocumentsSystemPageMenu: () => <nav data-testid="documents-system-page-menu" />,
}));

jest.mock("@features/documents-system/ui/page/documents-system-page-scroll-spy", () => ({
  useDocumentsSystemActiveHeading: (args: unknown) => useDocumentsSystemActiveHeadingMock(args),
}));

describe("DocumentsSystemPageToc", () => {
  beforeEach(() => {
    useDocumentsSystemActiveHeadingMock.mockClear();
    window.history.replaceState(null, "", "/docs");
    document.body.innerHTML = "";
  });

  it("keeps malformed percent-encoded hashes from crashing the page", async () => {
    document.body.innerHTML =
      '<main id="document-content"><h2 id="valid-heading">Valid</h2></main>';
    window.history.replaceState(null, "", "/docs#%E0%A4%A");

    expect(() =>
      render(<DocumentsSystemPageToc contentContainerId="document-content" enabled />)
    ).not.toThrow();

    await waitFor(() =>
      expect(useDocumentsSystemActiveHeadingMock).toHaveBeenCalledWith(
        expect.objectContaining({ hash: "%E0%A4%A" })
      )
    );
  });
});
