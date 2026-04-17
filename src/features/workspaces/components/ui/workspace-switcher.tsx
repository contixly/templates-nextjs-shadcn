"use client";

import * as React from "react";
import { Suspense, use, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@components/ui/badge";
import { BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { cn } from "@lib/utils";
import routes from "@features/routes";
import { ActionResult } from "@typings/actions";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { IconCheck, IconSelector, IconSettings } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface WorkspaceSwitcherProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

/**
 * WorkspaceSwitcher - Header dropdown for switching between workspaces
 *
 * Features:
 * - Displays current active workspace in trigger
 * - Lists all user's workspaces with default badge
 * - Handles workspace selection and context switching
 * - Shows loading state during switch
 * - Links to workspaces management page
 */
const WorkspaceSwitcherComponent = ({ loadUserWorkspacesPromise }: WorkspaceSwitcherProps) => {
  const t = useTranslations("workspaces.ui.switcher");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { workspaceId: currentWorkspaceId } = useParams<{ workspaceId?: string }>();
  const { data: workspaces } = use(loadUserWorkspacesPromise);
  const activeWorkspace = workspaces?.find((workspace) => workspace.id === currentWorkspaceId);

  const handleSelectWorkspace = (workspaceId: string) => {
    if (workspaceId === activeWorkspace?.id) return;
    setOpen(false);
    // router.push(routes.workspaces.pages.workspace_dashboard.path({ workspaceId })); // TODO switch to same route in another workspace
  };

  if (!currentWorkspaceId) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <BreadcrumbItem className="text-foreground cursor-pointer">
            <span className="truncate">{activeWorkspace?.name || t("fallback")}</span>
            <IconSelector className="h-4 w-4 shrink-0 opacity-50" />
          </BreadcrumbItem>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-75" align="start">
          <DropdownMenuLabel>{t("myWorkspaces")}</DropdownMenuLabel>
          <div className="max-h-125 overflow-y-auto">
            {workspaces?.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onSelect={() => handleSelectWorkspace(workspace.id)}
                className="cursor-pointer"
              >
                <IconCheck
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate">{workspace.name}</span>
                {workspace.isDefault && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {t("defaultBadge")}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setOpen(false);
              router.push(routes.workspaces.pages.workspaces.path());
            }}
            className="cursor-pointer"
          >
            <IconSettings className="mr-2 h-4 w-4" />
            {t("manageWorkspaces")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BreadcrumbSeparator> / </BreadcrumbSeparator>
    </>
  );
};

const WorkspaceSwitcherFallback = () => {
  return (
    <>
      <BreadcrumbItem>
        <BreadcrumbEllipsis />
      </BreadcrumbItem>
      <BreadcrumbSeparator> / </BreadcrumbSeparator>
    </>
  );
};

export const WorkspaceSwitcher = (props: WorkspaceSwitcherProps) => (
  <Suspense fallback={<WorkspaceSwitcherFallback />}>
    <WorkspaceSwitcherComponent {...props} />
  </Suspense>
);
