import * as React from "react";
import { Suspense, use } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
} from "@components/ui/sidebar";
import { NavSecondary } from "@components/application/navigation/nav-secondary";
import { NavUser } from "@features/accounts/components/nav/nav-user";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { getTFromCookie } from "@lib/cookies";
import { SIDEBAR_COOKIE_KEY } from "@lib/environment";
import { Spinner } from "@components/ui/spinner";
import { NavMain } from "./navigation/nav-main";
import { loadUserWorkspaces } from "@features/workspaces/actions/load-user-workspaces";
import { WorkspaceSidebarSwitcher } from "@features/workspaces/components/ui/workspace-sidebar-switcher";

interface SidebarProviderWrapperProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  globalSpinner?: boolean;
  renderFallbackClosedSidebar?: boolean;
}

export const SidebarProviderWrapper = async ({
  children,
  globalSpinner = false,
  renderFallbackClosedSidebar = true,
  ...providerProps
}: SidebarProviderWrapperProps) => {
  const getSideBarStatePromise = getTFromCookie<boolean>(SIDEBAR_COOKIE_KEY);

  return (
    <Suspense
      fallback={
        globalSpinner ? (
          <div className="fixed inset-0 z-10 flex h-full w-full items-center justify-center">
            <Spinner className="size-10" />
          </div>
        ) : renderFallbackClosedSidebar ? (
          <SidebarProviderComponent defaultOpen={false} {...providerProps} />
        ) : null
      }
    >
      <SidebarProviderLoader getSideBarStatePromise={getSideBarStatePromise} {...providerProps}>
        {children}
      </SidebarProviderLoader>
    </Suspense>
  );
};

const SidebarProviderLoader = ({
  getSideBarStatePromise,
  ...props
}: SidebarProviderWrapperProps & { getSideBarStatePromise: Promise<boolean | undefined> }) => {
  const sideBarState = use(getSideBarStatePromise) ?? false;

  return <SidebarProviderComponent defaultOpen={sideBarState} {...props} />;
};

const SidebarProviderComponent = ({ ...props }: SidebarProviderWrapperProps) => (
  <SidebarProvider
    style={
      {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties
    }
    {...props}
  />
);

export const AppSidebar = async ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const loadCurrentUserPromise = loadCurrentUser();
  const loadUserWorkspacesPromise = loadUserWorkspaces();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSidebarSwitcher loadUserWorkspacesPromise={loadUserWorkspacesPromise} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSecondary className="mt-3" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser loadCurrentUserPromise={loadCurrentUserPromise} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
