"use client";

import { useCurrentPage } from "@hooks/use-current-page";
import { usePageTranslations } from "@hooks/use-page-translations";
import React from "react";
import { useDocument } from "@components/application/document/document-provider";
import { useIsMobile } from "@hooks/use-mobile";
import routes from "@features/routes";

export const DocumentHeader = () => {
  const currentPage = useCurrentPage();
  const { documentActions, title, description: documentDescription } = useDocument();
  const isMobile = useIsMobile();
  const pageTranslations = usePageTranslations(currentPage ?? routes.application.pages.home);
  const isHeaderHidden =
    !currentPage || (isMobile ? currentPage.hidePageHeaderOnMobile : currentPage.hidePageHeader);
  const description = isHeaderHidden
    ? null
    : (documentDescription ?? pageTranslations.description)?.trim().replace(/\.$/, "");

  if (isHeaderHidden) return null;

  return (
    <div className="bg-background z-10 flex items-start border-b border-dashed px-4 pt-4 pb-2 md:sticky md:top-(--header-height) lg:px-6">
      <div className="flex w-full max-w-md flex-col gap-1 md:max-w-2xl lg:max-w-none">
        <h1 className="text-md font-semibold tracking-tight md:text-2xl">
          {title ?? pageTranslations.title}
        </h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {documentActions && <div className="flex justify-end">{documentActions}</div>}
    </div>
  );
};
