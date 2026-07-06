"use client";

import { RefObject, useEffect, useState } from "react";

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
};

export type UseDocumentsSystemActiveHeadingOptions = ActiveHeadingOptions & {
  menuItems: DocumentsSystemPageMenuItem[];
  hash?: string;
  enabled: boolean;
  contentRef: RefObject<HTMLElement | null>;
};

const getHeadingPositions = (
  content: HTMLElement,
  menuItems: DocumentsSystemPageMenuItem[]
): HeadingPosition[] => {
  const menuIds = new Set(menuItems.map((item) => item.href));

  return Array.from(content.querySelectorAll<HTMLElement>("h2[id]"))
    .filter((heading) => menuIds.has(heading.id))
    .map((heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top + window.scrollY,
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
  const viewportBottom = window.scrollY + window.innerHeight;
  const documentBottom = document.documentElement.scrollHeight;

  if (documentBottom - viewportBottom <= pageBottomThreshold) {
    return positions.at(-1)?.id;
  }

  const currentTop = window.scrollY + activationOffset;
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

    const updateActiveHeading = () => {
      frameId = undefined;
      const content = contentRef.current;

      if (!content) {
        return;
      }

      setActiveHeadingId(
        getActiveHeadingId(getHeadingPositions(content, menuItems), {
          activationOffset,
          pageBottomThreshold,
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

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [activationOffset, contentRef, enabled, menuItems, pageBottomThreshold]);

  return enabled && menuItems.length > 0 ? activeHeadingId : undefined;
};
