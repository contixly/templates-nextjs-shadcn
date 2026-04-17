"use client";

import { useCurrentPage } from "@hooks/use-current-page";
import { usePageTranslations } from "@hooks/use-page-translations";
import { IconHome } from "@tabler/icons-react";
import * as React from "react";
import { BreadcrumbItem, BreadcrumbLink } from "@components/ui/breadcrumb";
import routes from "@features/routes";

export const AppBreadcrumbsHome = () => {
  const page = useCurrentPage();
  const homeTranslations = usePageTranslations(routes.application.pages.home);

  if (page === null) return null;
  if (page?.pathTemplate !== "/") return null;

  return (
    <BreadcrumbItem className="hidden md:block">
      <BreadcrumbLink
        href={routes.application.pages.home.path()}
        className="text-foreground flex items-center gap-1.5 hover:underline"
      >
        <IconHome className="size-4" />
        <span className="hidden lg:block">{homeTranslations.title}</span>
      </BreadcrumbLink>
    </BreadcrumbItem>
  );
};
