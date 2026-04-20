"use client";

import { Suspense, use, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Skeleton } from "@components/ui/skeleton";
import { WorkspaceCreateDialog } from "@features/workspaces/components/forms/workspace-create-dialog";
import { ActionResult } from "@typings/actions";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { IconCheck, IconLayoutGrid, IconSelector, IconSettings } from "@tabler/icons-react";
import { cn } from "@lib/utils";
import routes from "@features/routes";
import { setActiveOrganization } from "@features/organizations/actions/set-active-organization";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface WorkspaceSidebarSwitcherProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

const getWorkspaceInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

const WorkspaceSidebarSwitcherComponent = ({
  loadUserWorkspacesPromise,
}: WorkspaceSidebarSwitcherProps) => {
  const t = useTranslations("workspaces.ui.switcher");
  const tCreateDialog = useTranslations("workspaces.ui.createDialog");
  const { isMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { organizationId } = useParams<{ organizationId?: string }>();
  const { data } = use(loadUserWorkspacesPromise);
  const workspaces = data ?? [];
  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === organizationId) ??
    workspaces.find((workspace) => workspace.isDefault) ??
    workspaces[0] ??
    null;

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
    router.refresh();

    if (isMobile) {
      toggleSidebar();
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id && organizationId === workspaceId) {
      setOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await setActiveOrganization({ organizationId: workspaceId });

      if (!result.success) {
        toast.error(t("switchError"));
        return;
      }

      navigateTo(
        routes.dashboard.pages.organization_dashboard.path({ organizationId: workspaceId })
      );
    });
  };

  if (workspaces.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <WorkspaceCreateDialog
            trigger={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <IconLayoutGrid className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{tCreateDialog("trigger")}</span>
                  <span className="text-muted-foreground truncate text-xs">{t("fallback")}</span>
                </div>
              </SidebarMenuButton>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!currentWorkspace) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold">
                {getWorkspaceInitials(currentWorkspace.name) || "WS"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentWorkspace.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {currentWorkspace.isDefault
                    ? t("defaultBadge")
                    : (currentWorkspace.slug ?? t("fallback"))}
                </span>
              </div>
              <IconSelector className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t("myWorkspaces")}
            </DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onSelect={() => handleSelectWorkspace(workspace.id)}
                disabled={isPending}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-[11px] font-semibold">
                  {getWorkspaceInitials(workspace.name) || "WS"}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate">{workspace.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {workspace.slug ?? t("fallback")}
                  </span>
                </div>
                {workspace.isDefault ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {t("defaultBadge")}
                  </Badge>
                ) : null}
                <IconCheck
                  className={cn(
                    "size-4",
                    workspace.id === currentWorkspace.id && organizationId === workspace.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onSelect={() => navigateTo(routes.workspaces.pages.workspaces.path())}
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <IconSettings className="size-3.5" />
              </div>
              <span>{t("manageWorkspaces")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const WorkspaceSidebarSwitcherFallback = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg" className="pointer-events-none">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg border">
          <IconLayoutGrid className="size-4 opacity-60" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

export const WorkspaceSidebarSwitcher = (props: WorkspaceSidebarSwitcherProps) => (
  <Suspense fallback={<WorkspaceSidebarSwitcherFallback />}>
    <WorkspaceSidebarSwitcherComponent {...props} />
  </Suspense>
);
