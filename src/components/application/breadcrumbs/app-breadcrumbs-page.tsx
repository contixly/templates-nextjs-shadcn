"use client";
import "client-only";

import React from "react";
import { useDocument } from "@components/application/document/document-provider";
import { Page } from "@typings/pages";
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import { usePageTranslations } from "@hooks/use-page-translations";

interface AppBreadcrumbsPageProps {
  page: Page;
}

export const AppBreadcrumbsPage = ({ page }: AppBreadcrumbsPageProps) => {
  const { title: documentTitle } = useDocument();
  const pageTranslations = usePageTranslations(page);

  const pageTitle =
    page.breadcrumbs?.hideTemplateTitle || page.breadcrumbs?.hideBreadcrumbs
      ? null
      : pageTranslations.title;
  const title = documentTitle ?? pageTitle;
  const description =
    page.breadcrumbs?.hideBreadcrumbs || page.breadcrumbs?.hideTemplateDescription
      ? null
      : pageTranslations.description?.trim().replace(/\.$/, "");

  return (
    <>
      <BreadcrumbItem className="max-w-2/3 truncate md:max-w-none">
        <BreadcrumbPage className="flex items-center gap-1.5">{title}</BreadcrumbPage>
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
