"use client";

import { useParams } from "next/navigation";
import Link from "@components/ui/custom/animated-link";
import { WorkspaceCreateDialog } from "@features/workspaces/components/forms/workspace-create-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/sidebar";
import routes from "@features/routes";
import { IconCirclePlusFilled, IconDashboard } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

export const NavMain = () => {
  const tApplication = useTranslations("application.ui.navigation");
  const tWorkspaces = useTranslations("workspaces.ui.navigation");
  const { organizationId } = useParams<{ organizationId?: string }>();
  const dashboardHref = organizationId
    ? routes.dashboard.pages.organization_dashboard.path({ organizationId })
    : routes.dashboard.pages.application_dashboard.path();

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
                <Link href={dashboardHref}>
                  <IconDashboard />
                  <span>{tApplication("dashboard")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
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
    </>
  );
};
