"use client";

import { RefObject, useEffect, useState } from "react";
import { DOCUMENTS_SYSTEM_SCROLL_CONTAINER_ATTRIBUTE } from "@features/documents-system/documents-system-consts";

export const DEFAULT_HEADING_ACTIVATION_OFFSET = 120;
export const DEFAULT_PAGE_BOTTOM_THRESHOLD = 24;

export type DocumentsSystemPageMenuItem = {
  label: string;
  href: string;
};

export type HeadingPosition = {
  id: string;
  top: number;
};

export type ActiveHeadingOptions = {
  activationOffset?: number;
  pageBottomThreshold?: number;
  scrollRoot?: DocumentsSystemScrollRoot;
};

export type UseDocumentsSystemActiveHeadingOptions = ActiveHeadingOptions & {
  menuItems: DocumentsSystemPageMenuItem[];
  hash?: string;
  enabled: boolean;
  contentRef: RefObject<HTMLElement | null>;
};

export type DocumentsSystemScrollRoot = HTMLElement | Window;

const isElementScrollRoot = (scrollRoot: DocumentsSystemScrollRoot): scrollRoot is HTMLElement =>
  scrollRoot instanceof HTMLElement;

const getScrollRootTop = (scrollRoot: DocumentsSystemScrollRoot) =>
  isElementScrollRoot(scrollRoot) ? scrollRoot.getBoundingClientRect().top : 0;

const getScrollTop = (scrollRoot: DocumentsSystemScrollRoot) =>
  isElementScrollRoot(scrollRoot) ? scrollRoot.scrollTop : window.scrollY;

const getScrollViewportHeight = (scrollRoot: DocumentsSystemScrollRoot) =>
  isElementScrollRoot(scrollRoot) ? scrollRoot.clientHeight : window.innerHeight;

const getScrollHeight = (scrollRoot: DocumentsSystemScrollRoot) =>
  isElementScrollRoot(scrollRoot) ? scrollRoot.scrollHeight : document.documentElement.scrollHeight;

export const getDocumentsSystemScrollRoot = (content: HTMLElement): DocumentsSystemScrollRoot =>
  content.closest<HTMLElement>(`[${DOCUMENTS_SYSTEM_SCROLL_CONTAINER_ATTRIBUTE}]`) ?? window;

export const getHeadingPositions = (
  content: HTMLElement,
  menuItems: DocumentsSystemPageMenuItem[],
  scrollRoot: DocumentsSystemScrollRoot = window
): HeadingPosition[] => {
  const menuIds = new Set(menuItems.map((item) => item.href));
  const scrollRootTop = getScrollRootTop(scrollRoot);
  const scrollTop = getScrollTop(scrollRoot);

  return Array.from(content.querySelectorAll<HTMLElement>("h2[id]"))
    .filter((heading) => menuIds.has(heading.id))
    .map((heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top - scrollRootTop + scrollTop,
    }));
};

export const getActiveHeadingId = (
  positions: HeadingPosition[],
  options: ActiveHeadingOptions = {}
) => {
  if (positions.length === 0) {
    return undefined;
  }

  const activationOffset = options.activationOffset ?? DEFAULT_HEADING_ACTIVATION_OFFSET;
  const pageBottomThreshold = options.pageBottomThreshold ?? DEFAULT_PAGE_BOTTOM_THRESHOLD;
  const scrollRoot = options.scrollRoot ?? window;
  const scrollTop = getScrollTop(scrollRoot);
  const viewportBottom = scrollTop + getScrollViewportHeight(scrollRoot);
  const documentBottom = getScrollHeight(scrollRoot);

  if (documentBottom - viewportBottom <= pageBottomThreshold) {
    return positions.at(-1)?.id;
  }

  const currentTop = scrollTop + activationOffset;
  const active = positions.findLast((position) => position.top <= currentTop);

  return active?.id ?? positions[0]?.id;
};

export const useDocumentsSystemActiveHeading = ({
  menuItems,
  hash,
  enabled,
  contentRef,
  activationOffset,
  pageBottomThreshold,
}: UseDocumentsSystemActiveHeadingOptions) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>();

  useEffect(() => {
    if (!enabled || !hash) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setActiveHeadingId(hash);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [enabled, hash]);

  useEffect(() => {
    if (!enabled || menuItems.length === 0) {
      return;
    }

    let frameId: number | undefined;

    const content = contentRef.current;
    const scrollRoot = content ? getDocumentsSystemScrollRoot(content) : window;

    const updateActiveHeading = () => {
      frameId = undefined;
      const content = contentRef.current;

      if (!content) {
        return;
      }

      const activeScrollRoot = getDocumentsSystemScrollRoot(content);

      setActiveHeadingId(
        getActiveHeadingId(getHeadingPositions(content, menuItems, activeScrollRoot), {
          activationOffset,
          pageBottomThreshold,
          scrollRoot: activeScrollRoot,
        })
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(updateActiveHeading);
    };

    scheduleUpdate();

    scrollRoot.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      scrollRoot.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [activationOffset, contentRef, enabled, menuItems, pageBottomThreshold]);

  return enabled && menuItems.length > 0 ? activeHeadingId : undefined;
};
