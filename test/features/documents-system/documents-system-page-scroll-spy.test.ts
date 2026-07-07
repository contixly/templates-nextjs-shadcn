import {
  getActiveHeadingId,
  getDocumentsSystemScrollRoot,
  getHeadingPositions,
} from "@features/documents-system/ui/page/documents-system-page-scroll-spy";

const setReadonlyMetric = (
  element: HTMLElement,
  key: "clientHeight" | "scrollHeight",
  value: number
) => {
  Object.defineProperty(element, key, {
    configurable: true,
    value,
  });
};

const setElementRectTop = (element: HTMLElement, top: number) => {
  element.getBoundingClientRect = () =>
    ({
      top,
      bottom: top,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
};

describe("documents-system page scroll spy", () => {
  it("measures active headings against the docs scroll container", () => {
    const scrollContainer = document.createElement("div");
    scrollContainer.setAttribute("data-documents-system-scroll-container", "true");
    scrollContainer.scrollTop = 0;
    setReadonlyMetric(scrollContainer, "clientHeight", 500);
    setReadonlyMetric(scrollContainer, "scrollHeight", 1000);
    setElementRectTop(scrollContainer, 100);

    const content = document.createElement("article");
    const firstHeading = document.createElement("h2");
    const secondHeading = document.createElement("h2");
    firstHeading.id = "first";
    secondHeading.id = "second";
    setElementRectTop(firstHeading, 100);
    setElementRectTop(secondHeading, 180);

    content.append(firstHeading, secondHeading);
    scrollContainer.append(content);
    document.body.append(scrollContainer);

    const scrollRoot = getDocumentsSystemScrollRoot(content);
    const positions = getHeadingPositions(
      content,
      [
        { href: "first", label: "First" },
        { href: "second", label: "Second" },
      ],
      scrollRoot
    );

    expect(scrollRoot).toBe(scrollContainer);
    expect(getActiveHeadingId(positions, { activationOffset: 120, scrollRoot })).toBe("second");
  });
});
