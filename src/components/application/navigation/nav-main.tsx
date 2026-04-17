import {
  IconChecklist,
  IconCirclePlusFilled,
  IconCodeDots,
  IconDashboard,
  IconMail,
  IconTargetArrow,
} from "@tabler/icons-react";
import { Suspense } from "react";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/ui/sidebar";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { ActionResult } from "@typings/actions";
import { NavMainComponent } from "@components/application/navigation/nav-main-component";
import { useTranslations } from "next-intl";

export interface NavMainProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

const workspaceFallbackItems = [
  { icon: IconTargetArrow, labelWidthClassName: "w-12" },
  { icon: IconChecklist, labelWidthClassName: "w-12" },
];

const WorkspaceMenuFallback = ({
  showWorkspaceTitle = false,
}: {
  showWorkspaceTitle?: boolean;
}) => {
  const tCommon = useTranslations("common.ui.accessibility");
  const tSwitcher = useTranslations("workspaces.ui.switcher");

  return (
    <>
      {showWorkspaceTitle && (
        <SidebarMenuItem>
          <SidebarMenuButton
            className="pointer-events-none mb-2 border-b group-data-[collapsible=icon]:border-none"
            tooltip={tSwitcher("fallback")}
          >
            <IconCodeDots />
            <Skeleton className="h-4 w-24" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {workspaceFallbackItems.map((item, index) => (
        <SidebarMenuItem key={`workspace-menu-fallback-${index}`}>
          <SidebarMenuButton
            className="pointer-events-none flex items-center justify-between"
            tooltip={tCommon("loading")}
          >
            {item.icon && <item.icon />}
            <Skeleton className={`h-4 ${item.labelWidthClassName}`} />
            <Skeleton className="ml-auto h-5 w-7" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

const NavMainSkeleton = () => {
  const tApplication = useTranslations("application.ui.navigation");
  const tWorkspaces = useTranslations("workspaces.ui.navigation");
  const tCommon = useTranslations("common.ui.accessibility");

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={tApplication("dashboard")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground pointer-events-none min-w-8 duration-200 ease-linear"
              >
                <IconDashboard />
                <span>{tApplication("dashboard")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="mb-2 justify-center text-lg">
          <Skeleton className="h-6 w-28" />
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem className="mb-4 flex items-center gap-2">
              <SidebarMenuButton
                tooltip={tWorkspaces("quickCreate")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground pointer-events-none min-w-8 duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>{tWorkspaces("quickCreate")}</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                disabled
              >
                <IconMail />
                <span className="sr-only">{tCommon("inbox")}</span>
              </Button>
            </SidebarMenuItem>
            <WorkspaceMenuFallback />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="mt-2 group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="mb-2 justify-center text-lg">
          {tWorkspaces("otherWorkspaces")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <WorkspaceMenuFallback showWorkspaceTitle />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={tWorkspaces("createNewWorkspaceTooltip")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground pointer-events-none min-w-8 duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>{tWorkspaces("createNewWorkspace")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export const NavMain = (props: NavMainProps) => {
  return (
    <Suspense fallback={<NavMainSkeleton />}>
      <NavMainComponent {...props} />
    </Suspense>
  );
};
