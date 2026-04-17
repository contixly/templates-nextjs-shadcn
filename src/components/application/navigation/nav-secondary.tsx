"use client";

import { IconHelp } from "@tabler/icons-react";
import * as React from "react";
import { ComponentProps, useCallback } from "react";
import Link from "@components/ui/custom/animated-link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton as SidebarMenuButtonLibrary,
  SidebarMenuItem,
  useSidebar,
} from "@components/ui/sidebar";
import routes from "@features/routes";
import { APP_BASE_URL } from "@lib/environment";
import { getMenuItem } from "@lib/ui";
import { usePageTranslations } from "@hooks/use-page-translations";
import { useTranslations } from "next-intl";

const SidebarMenuButton = (props: ComponentProps<typeof SidebarMenuButtonLibrary>) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const menuOnClickCallback = useCallback(() => {
    if (isMobile) {
      toggleSidebar();
    }
  }, [isMobile, toggleSidebar]);

  return <SidebarMenuButtonLibrary onClick={menuOnClickCallback} {...props} />;
};

export const NavSecondary = ({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) => {
  const t = useTranslations("application.ui.navigation");
  const homeTranslations = usePageTranslations(routes.application.pages.home);
  const workspacesTranslations = usePageTranslations(routes.workspaces.pages.workspaces);
  const profileTranslations = usePageTranslations(routes.accounts.pages.profile);

  const items = [
    getMenuItem(routes.application.pages.home, homeTranslations.title),
    getMenuItem(routes.workspaces.pages.workspaces, workspacesTranslations.title),
    getMenuItem(routes.accounts.pages.profile, profileTranslations.title),
    {
      label: t("getHelp"),
      url: APP_BASE_URL,
      icon: IconHelp,
    },
  ];

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild tooltip={item.label}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
