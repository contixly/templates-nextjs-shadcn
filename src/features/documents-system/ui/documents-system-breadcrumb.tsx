"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import { DOCUMENTS_SYSTEM_BREADCRUMB_MARKER_ID } from "@features/documents-system/documents-system-consts";
import routes from "@features/routes";

type CurrentBreadcrumb = {
  group: string;
  parentItem: string;
  title: string;
};

const readCurrentBreadcrumb = (): CurrentBreadcrumb | undefined => {
  const marker = document.getElementById(DOCUMENTS_SYSTEM_BREADCRUMB_MARKER_ID);
  if (!(marker instanceof HTMLElement)) return undefined;

  const { group, parentItem, title } = marker.dataset;
  if (!group || !parentItem || !title) return undefined;

  return { group, parentItem, title };
};

export const DocumentsSystemBreadcrumb = () => {
  const pathname = usePathname();
  const [breadcrumb, setBreadcrumb] = useState<CurrentBreadcrumb>();
  const isHomePage = pathname === routes.documents_system.pages.home.pathTemplate;

  useEffect(() => {
    if (isHomePage) {
      return;
    }

    let frameId: number | undefined;

    const updateBreadcrumb = () => {
      frameId = undefined;
      setBreadcrumb(readCurrentBreadcrumb());
    };

    const scheduleUpdate = () => {
      if (frameId !== undefined) return;
      frameId = window.requestAnimationFrame(updateBreadcrumb);
    };

    scheduleUpdate();

    const root = document.querySelector('[data-slot="sidebar-inset"]') ?? document.body;
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isHomePage, pathname]);

  if (isHomePage || !breadcrumb) {
    return null;
  }

  return (
    <>
      <BreadcrumbSeparator className="hidden lg:block" />
      <BreadcrumbItem className="hidden lg:block">
        <BreadcrumbPage>{breadcrumb.group}</BreadcrumbPage>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="hidden xl:block" />
      <BreadcrumbItem className="hidden xl:block">
        <BreadcrumbPage>{breadcrumb.parentItem}</BreadcrumbPage>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
};
