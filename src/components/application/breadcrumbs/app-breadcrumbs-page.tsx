"use client";
import "client-only";

import React, { useEffect, useMemo, useState } from "react";
import { useDocument } from "@components/application/document/document-provider";
import { Page } from "@typings/pages";
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";

interface AppBreadcrumbsPageProps {
  page: Page;
}

export const AppBreadcrumbsPage = ({ page }: AppBreadcrumbsPageProps) => {
  const { title: documentTitle, category } = useDocument();

  const [title, setTitle] = useState<string | null>(
    page.breadcrumbs?.hideTemplateTitle || page.breadcrumbs?.hideBreadcrumbs ? null : page.title
  );

  useEffect(() => {
    setTitle(documentTitle);
  }, [documentTitle]);

  const description = useMemo(() => {
    if (page.breadcrumbs?.hideBreadcrumbs || page.breadcrumbs?.hideTemplateDescription) return null;
    return page.description?.trim().replace(/\.$/, "");
  }, [
    page.breadcrumbs?.hideBreadcrumbs,
    page.breadcrumbs?.hideTemplateDescription,
    page.description,
  ]);

  return (
    <>
      <BreadcrumbItem className="max-w-2/3 truncate md:max-w-none">
        <BreadcrumbPage className="flex items-center gap-1.5">
          {title ??
            (page.breadcrumbs?.hideTemplateTitle || page.breadcrumbs?.hideBreadcrumbs
              ? undefined
              : page.title)}
        </BreadcrumbPage>
      </BreadcrumbItem>
      {description && (
        <>
          <BreadcrumbSeparator className="hidden truncate lg:block lg:max-w-1/2 xl:max-w-full">
            {" "}
            -{" "}
          </BreadcrumbSeparator>
          <BreadcrumbItem className="hidden truncate lg:block lg:max-w-1/2 xl:max-w-full">
            <BreadcrumbPage>{description}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </>
  );
};
