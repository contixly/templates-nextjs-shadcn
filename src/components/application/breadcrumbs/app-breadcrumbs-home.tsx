"use client";

import { useCurrentPage } from "@hooks/use-current-page";
import { IconHome } from "@tabler/icons-react";
import * as React from "react";
import { BreadcrumbItem, BreadcrumbLink } from "@components/ui/breadcrumb";
import routes from "@features/routes";

export const AppBreadcrumbsHome = () => {
  const page = useCurrentPage();

  if (page === null) return null;
  if (page?.pathTemplate !== "/") return null;

  return (
    <BreadcrumbItem className="hidden md:block">
      <BreadcrumbLink
        href={routes.application.pages.home.path()}
        className="text-foreground flex items-center gap-1.5 hover:underline"
      >
        <IconHome className="size-4" />
        <span className="hidden lg:block">{routes.application.pages.home.title}</span>
      </BreadcrumbLink>
    </BreadcrumbItem>
  );
};
