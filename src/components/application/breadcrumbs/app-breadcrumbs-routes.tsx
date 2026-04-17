"use client";
import "client-only";

import { useCurrentPage } from "@hooks/use-current-page";
import { usePageTranslations } from "@hooks/use-page-translations";
import * as React from "react";
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import { ActionResult } from "@typings/actions";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { WorkspaceSwitcher } from "@features/workspaces/components/ui/workspace-switcher";
import { AppBreadcrumbsPage } from "@components/application/breadcrumbs/app-breadcrumbs-page";
import routes from "@features/routes";

interface AppBreadcrumbsRoutesProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

export const AppBreadcrumbsRoutes = ({ loadUserWorkspacesPromise }: AppBreadcrumbsRoutesProps) => {
  const page = useCurrentPage();
  const currentPageTranslations = usePageTranslations(page ?? routes.application.pages.home);
  const parentPageTranslations = usePageTranslations(
    page?.parent ?? page ?? routes.application.pages.home
  );

  if (page === null || page.pathTemplate === "/") return null;

  const hasParentOrSelfParent = page.parent || page.selfParent;
  const breadcrumbTitle = page.parent
    ? parentPageTranslations.title
    : currentPageTranslations.title;

  return (
    <>
      <WorkspaceSwitcher loadUserWorkspacesPromise={loadUserWorkspacesPromise} />
      {hasParentOrSelfParent && (
        <>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbPage>{breadcrumbTitle}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block"> / </BreadcrumbSeparator>
        </>
      )}
      <AppBreadcrumbsPage page={page} />
    </>
  );
};
