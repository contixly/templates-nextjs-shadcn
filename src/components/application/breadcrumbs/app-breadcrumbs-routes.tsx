"use client";
import "client-only";

import { useCurrentPage } from "@hooks/use-current-page";
import * as React from "react";
import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import { ActionResult } from "@typings/actions";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { WorkspaceSwitcher } from "@features/workspaces/components/ui/workspace-switcher";
import { AppBreadcrumbsPage } from "@components/application/breadcrumbs/app-breadcrumbs-page";

interface AppBreadcrumbsRoutesProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

export const AppBreadcrumbsRoutes = ({ loadUserWorkspacesPromise }: AppBreadcrumbsRoutesProps) => {
  const page = useCurrentPage();

  if (page === null || page.pathTemplate === "/") return null;

  const hasParentOrSelfParent = page.parent || page.selfParent;

  return (
    <>
      <WorkspaceSwitcher loadUserWorkspacesPromise={loadUserWorkspacesPromise} />
      {hasParentOrSelfParent && (
        <>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbPage>{page.parent?.title ?? page.title ?? ""}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block"> / </BreadcrumbSeparator>
        </>
      )}
      <AppBreadcrumbsPage page={page} />
    </>
  );
};
