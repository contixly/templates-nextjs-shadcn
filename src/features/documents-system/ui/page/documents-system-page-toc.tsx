"use client";

import React, { useEffect, useRef, useState } from "react";
import { normalizeDocumentGeneratedHeadingIds } from "@features/documents-system/documents-system-heading-tools";
import { DocumentsSystemPageMenu } from "./documents-system-page-menu";
import { useDocumentsSystemActiveHeading } from "./documents-system-page-scroll-spy";

type PageMenuItem = {
  label: string;
  href: string;
};

const readCurrentHash = () => {
  const rawHash = window.location.hash.replace(/^#/, "");

  try {
    return decodeURIComponent(rawHash);
  } catch {
    return rawHash;
  }
};

const useUrlAnchor = () => {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(readCurrentHash());

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return hash;
};

export const DocumentsSystemPageToc = ({
  contentContainerId,
  enabled,
}: {
  contentContainerId: string;
  enabled: boolean;
}) => {
  const contentRef = useRef<HTMLElement | null>(null);
  const [menuItems, setMenuItems] = useState<PageMenuItem[]>([]);
  const hash = useUrlAnchor();
  const activeHeadingId = useDocumentsSystemActiveHeading({
    menuItems,
    hash,
    enabled,
    contentRef,
  });

  useEffect(() => {
    const container = document.getElementById(contentContainerId);
    if (!(container instanceof HTMLElement)) return;

    contentRef.current = container;

    const buildMenu = () => {
      normalizeDocumentGeneratedHeadingIds(container);

      if (!enabled) {
        setMenuItems([]);
        return;
      }

      const headings = Array.from(container.querySelectorAll("h2[id]")) as HTMLElement[];
      const seen = new Set<string>();
      const items = headings
        .map((element) => {
          const id = element.id.trim();
          if (!id) return null;

          return { label: (element.textContent || id).trim(), href: id };
        })
        .filter((item): item is PageMenuItem => Boolean(item))
        .filter((item) => {
          if (seen.has(item.href)) return false;
          seen.add(item.href);
          return true;
        });

      setMenuItems(items);
    };

    buildMenu();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData" ||
          mutation.type === "attributes"
        ) {
          buildMenu();
          break;
        }
      }
    });

    observer.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["id"],
    });

    return () => {
      observer.disconnect();
      contentRef.current = null;
    };
  }, [contentContainerId, enabled]);

  useEffect(() => {
    if (!hash) return;

    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [hash]);

  if (!enabled) {
    return null;
  }

  return (
    <aside className="hidden xl:block">
      <DocumentsSystemPageMenu menuItems={menuItems} activeHref={activeHeadingId} />
    </aside>
  );
};
