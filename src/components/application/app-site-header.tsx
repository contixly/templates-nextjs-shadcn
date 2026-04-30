import React from "react";
import { ThemeSwitcher } from "@components/application/theme/theme-switcher";
import { NavUserLogin } from "@features/accounts/components/nav/nav-user-login";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { AppBreadcrumbs } from "@components/application/breadcrumbs/app-breadcrumbs";
import { getFromCookie } from "@lib/cookies";
import { LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import { loadUserWorkspaces } from "@features/workspaces/actions/load-user-workspaces";
import { AppSiteHeaderTrigger } from "@components/application/app-site-header-trigger";
import { getConfiguredSocialProviderIds } from "@server/auth/social-providers";

interface AppSiteHeaderProps {
  hideSidebarTrigger?: boolean;
  style?: React.CSSProperties;
}

export const AppSiteHeader = ({ hideSidebarTrigger, style }: AppSiteHeaderProps) => {
  const loadCurrentUserIdPromise = loadCurrentUserId();
  const getLastLoginPromise = getFromCookie(LAST_LOGIN_METHOD_KEY);
  const loadUserWorkspacesPromise = loadUserWorkspaces();
  const socialProviderIds = getConfiguredSocialProviderIds();

  return (
    <header
      style={style}
      className="bg-background z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:sticky md:top-0"
    >
      <div className="flex w-full items-center gap-1 pr-2 pl-1 md:pl-4 lg:gap-2 lg:pl-4">
        <AppSiteHeaderTrigger hidden={hideSidebarTrigger} />
        <AppBreadcrumbs loadUserWorkspacesPromise={loadUserWorkspacesPromise} />
        <div className="ml-auto flex items-center gap-2">
          <NavUserLogin
            loadCurrentUserIdPromise={loadCurrentUserIdPromise}
            getLastLoginPromise={getLastLoginPromise}
            socialProviderIds={socialProviderIds}
            dotShowLogout
            variant="outline"
          />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};
