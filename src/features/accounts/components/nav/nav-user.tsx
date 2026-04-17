"use client";

import { Avatar, AvatarFallback } from "@components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@components/ui/sidebar";
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
} from "@tabler/icons-react";
import { User } from "better-auth";
import * as React from "react";
import { startTransition, Suspense, use, useCallback } from "react";
import routes from "@features/routes";
import { useRouter } from "next/navigation";
import { useLogout } from "@features/accounts/components/ui/logout-button";
import { UserContent } from "@features/accounts/components/ui/user-content";
import { usePageTranslations } from "@hooks/use-page-translations";
import { useTranslations } from "next-intl";

interface NavUserProps extends React.ComponentPropsWithoutRef<typeof SidebarMenu> {
  loadCurrentUserPromise: Promise<User | undefined>;
}

const NavUserComponent = ({ loadCurrentUserPromise, ...props }: NavUserProps) => {
  const tAccounts = useTranslations("accounts.ui.navUser");
  const { isMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const user = use(loadCurrentUserPromise);
  const { logout } = useLogout();
  const profileTranslations = usePageTranslations(routes.accounts.pages.profile);

  const menuClick = useCallback(
    (path: string) =>
      startTransition(() => {
        router.push(path);
        if (isMobile) toggleSidebar();
      }),
    [isMobile, router, toggleSidebar]
  );

  return (
    <SidebarMenu className={props.className}>
      <SidebarMenuItem>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserContent user={user} />
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <UserContent user={user} />
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => menuClick(routes.accounts.pages.profile.path())}>
                  {routes.accounts.pages.profile.icon && <routes.accounts.pages.profile.icon />}
                  {profileTranslations.title}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconCreditCard />
                  {tAccounts("billing")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconNotification />
                  {tAccounts("notifications")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <IconLogout />
                {tAccounts("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const NavUserFallbackComponent = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="bg-sidebar rounded-lg" />
        </Avatar>
        <IconDotsVertical className="ml-auto size-4" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

export const NavUser = ({ ...props }: NavUserProps) => (
  <Suspense fallback={<NavUserFallbackComponent />}>
    <NavUserComponent {...props} />
  </Suspense>
);
