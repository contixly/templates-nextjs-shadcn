import * as React from "react";
import { Suspense } from "react";
import { AppBreadcrumbsHome } from "@components/application/breadcrumbs/app-breadcrumbs-home";
import { AppBreadcrumbsRoutes } from "@components/application/breadcrumbs/app-breadcrumbs-routes";
import { Breadcrumb, BreadcrumbList } from "@components/ui/breadcrumb";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { ActionResult } from "@typings/actions";

interface AppBreadcrumbsProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

export const AppBreadcrumbs = ({ loadUserWorkspacesPromise }: AppBreadcrumbsProps) => (
  <Breadcrumb className="w-full">
    <BreadcrumbList>
      <AppBreadcrumbsHome />
      <Suspense>
        <AppBreadcrumbsRoutes loadUserWorkspacesPromise={loadUserWorkspacesPromise} />
      </Suspense>
    </BreadcrumbList>
  </Breadcrumb>
);
