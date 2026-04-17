"use client";

import { cache, ComponentProps, Fragment, use, useCallback } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton as SidebarMenuButtonLibrary,
  SidebarMenuItem,
  useSidebar,
} from "@components/ui/sidebar";
import Link from "next/link";
import routes from "@features/routes";
import { IconCirclePlusFilled, IconCodeDots, IconDashboard, IconMail } from "@tabler/icons-react";
import { Button } from "@components/ui/button";
import { WorkspaceCreateDialog } from "@features/workspaces/components/forms/workspace-create-dialog";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { Badge } from "@components/ui/badge";
import { NavMainProps } from "@components/application/navigation/nav-main";
import { MenuItem } from "@typings/ui";
import { useTranslations } from "next-intl";

/** Empty placeholder — add per-workspace nav items when your feature defines routes under a workspace. */
const getWorkspaceMenuItems = cache((): (MenuItem & { count: number })[] => []);

const renderWorkspaceMenu = (
  workspace: WorkspaceWithCounts,
  navigationMessages: {
    workspaceTooltip: string;
    comingSoon: (label: string) => string;
  },
  isActiveWorkspace = false
) => (
  <Fragment key={workspace.id}>
    {!isActiveWorkspace && (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="mb-2 border-b group-data-[collapsible=icon]:border-none"
          tooltip={navigationMessages.workspaceTooltip}
        >
          <Link
            href={routes.workspaces.pages.workspaces.path({ workspaceId: workspace.id })}
            className="flex items-center justify-between font-medium"
          >
            <IconCodeDots />
            {workspace.name}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )}
    {getWorkspaceMenuItems().map((item) => {
      if (!item.url) {
        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              tooltip={navigationMessages.comingSoon(item.label)}
              className="text-muted-foreground/70 flex cursor-default items-center justify-between opacity-60"
              disabled
            >
              {item.icon && <item.icon />}
              <span>{item.label}</span>
              {item.count !== null && (
                <Badge variant="outline" className="ml-auto size-6 rounded-none">
                  {item.count}
                </Badge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }
      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton asChild tooltip={`${item.label} (${item.count})`}>
            <Link href={item.url} className="flex items-center justify-between">
              {item.icon && <item.icon />}
              <span>{item.label}</span>
              {item.count !== null && (
                <Badge variant="outline" className="ml-auto size-6 rounded-none">
                  {item.count}
                </Badge>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    })}
  </Fragment>
);

const SidebarMenuButton = (props: ComponentProps<typeof SidebarMenuButtonLibrary>) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const menuOnClickCallback = useCallback(() => {
    if (isMobile) {
      toggleSidebar();
    }
  }, [isMobile, toggleSidebar]);

  return <SidebarMenuButtonLibrary onClick={menuOnClickCallback} {...props} />;
};

export const NavMainComponent = ({ loadUserWorkspacesPromise }: NavMainProps) => {
  const tApplication = useTranslations("application.ui.navigation");
  const tWorkspaces = useTranslations("workspaces.ui.navigation");
  const tCommon = useTranslations("common.ui.accessibility");
  const { data: workspaces } = use(loadUserWorkspacesPromise);
  const defaultWorkspace = workspaces?.find((workspace) => workspace.isDefault);
  const nonDefaultWorkspaces = workspaces?.filter((workspace) => !workspace.isDefault);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={tApplication("dashboard")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <Link href={routes.dashboard.pages.application_dashboard.path()}>
                  <IconDashboard />
                  <span>{tApplication("dashboard")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {defaultWorkspace && (
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 justify-center text-lg">
            {defaultWorkspace.name}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="mb-4 flex items-center gap-2">
                <SidebarMenuButton
                  tooltip={tWorkspaces("quickCreateComingSoon")}
                  className="bg-primary/50 text-primary-foreground min-w-8 cursor-default opacity-60 duration-200 ease-linear"
                  disabled
                >
                  <IconCirclePlusFilled />
                  <span>{tWorkspaces("quickCreate")}</span>
                </SidebarMenuButton>
                <Button
                  size="icon"
                  className="size-8 cursor-default opacity-60 group-data-[collapsible=icon]:opacity-0"
                  variant="outline"
                  disabled
                  title={tCommon("inbox")}
                >
                  <IconMail />
                  <span className="sr-only">{tCommon("inbox")}</span>
                </Button>
              </SidebarMenuItem>
              {renderWorkspaceMenu(
                defaultWorkspace,
                {
                  workspaceTooltip: tWorkspaces("workspaceTooltip", {
                    name: defaultWorkspace.name,
                  }),
                  comingSoon: (label) => tWorkspaces("comingSoon", { label }),
                },
                true
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {nonDefaultWorkspaces && nonDefaultWorkspaces.length > 0 && (
        <SidebarGroup className="mt-2 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="mb-2 justify-center text-lg">
            {tWorkspaces("otherWorkspaces")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nonDefaultWorkspaces?.map((workspace) =>
                renderWorkspaceMenu(
                  workspace,
                  {
                    workspaceTooltip: tWorkspaces("workspaceTooltip", { name: workspace.name }),
                    comingSoon: (label) => tWorkspaces("comingSoon", { label }),
                  },
                  false
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {nonDefaultWorkspaces && (
        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <WorkspaceCreateDialog
                  trigger={
                    <SidebarMenuButton
                      tooltip={tWorkspaces("createNewWorkspaceTooltip")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                    >
                      <IconCirclePlusFilled />
                      <span>{tWorkspaces("createNewWorkspace")}</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
};
