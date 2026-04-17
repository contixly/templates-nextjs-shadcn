"use client";

import { useCurrentPage } from "@hooks/use-current-page";
import { usePageTranslations } from "@hooks/use-page-translations";
import React, { useMemo } from "react";
import { useDocument } from "@components/application/document/document-provider";
import { useIsMobile } from "@hooks/use-mobile";
import routes from "@features/routes";

export const DocumentHeader = () => {
  const currentPage = useCurrentPage();
  const { documentActions, title, description: documentDescription } = useDocument();
  const isMobile = useIsMobile();
  const pageTranslations = usePageTranslations(currentPage ?? routes.application.pages.home);

  const description = useMemo(() => {
    if (!currentPage || currentPage.hidePageHeader) return null;
    return (documentDescription ?? pageTranslations.description)?.trim().replace(/\.$/, "");
  }, [currentPage, documentDescription, pageTranslations.description]);

  if (!currentPage) return null;
  if (isMobile && currentPage.hidePageHeaderOnMobile) return null;
  if (!isMobile && currentPage.hidePageHeader) return null;

  return (
    <div className="bg-background z-10 flex items-start border-b border-dashed px-4 pt-4 pb-2 md:sticky md:top-(--header-height) lg:px-6">
      <div className="flex w-full max-w-md flex-col gap-1 md:max-w-2xl lg:max-w-none">
        <h1 className="text-md font-semibold tracking-tight md:text-2xl">
          {title ?? pageTranslations.title}
        </h1>
        <p className="text-muted-foreground min-h-5 text-sm">{description}</p>
      </div>
      {documentActions && <div className="flex justify-end">{documentActions}</div>}
    </div>
  );
};
