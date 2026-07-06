import React, { ReactNode } from "react";

export const getDocumentHeadingText = (children: ReactNode): string =>
  React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement<{ children?: ReactNode }>(child)) {
        return getDocumentHeadingText(child.props.children);
      }

      return "";
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export const slugifyDocumentHeadingText = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const slugifyDocumentHeading = (children: ReactNode) =>
  slugifyDocumentHeadingText(getDocumentHeadingText(children));

export const createUniqueDocumentHeadingId = (
  headingText: string,
  seenIds: Map<string, number>
) => {
  const baseId = slugifyDocumentHeadingText(headingText) || "section";
  const count = seenIds.get(baseId) ?? 0;
  seenIds.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count + 1}`;
};

const getDocumentHeadingElementText = (element: Element) => {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("button, [aria-hidden='true']").forEach((child) => child.remove());

  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
};

const isGeneratedDocumentHeadingId = (id: string, baseId: string) => {
  if (!id || id === baseId) {
    return true;
  }

  if (!id.startsWith(`${baseId}-`)) {
    return false;
  }

  return /^[1-9]\d*$/.test(id.slice(baseId.length + 1));
};

export const normalizeDocumentGeneratedHeadingIds = (container: ParentNode) => {
  const seenIds = new Map<string, number>();
  const headings = Array.from(container.querySelectorAll("h2, h3"));

  headings.forEach((heading) => {
    const text = getDocumentHeadingElementText(heading);
    const baseId = slugifyDocumentHeadingText(text) || "section";
    const uniqueId = createUniqueDocumentHeadingId(text, seenIds);
    const currentId = heading.id.trim();

    if (currentId !== uniqueId && isGeneratedDocumentHeadingId(currentId, baseId)) {
      heading.id = uniqueId;
    }
  });
};
