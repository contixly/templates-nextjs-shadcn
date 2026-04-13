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

const items = [
  getMenuItem(routes.application.pages.home),
  getMenuItem(routes.workspaces.pages.workspaces),
  getMenuItem(routes.accounts.pages.profile),
  {
    label: "Get Help",
    url: APP_BASE_URL,
    icon: IconHelp,
  },
];

const SidebarMenuButton = (props: ComponentProps<typeof SidebarMenuButtonLibrary>) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const menuOnClickCallback = useCallback(() => {
    if (isMobile) {
      toggleSidebar();
    }
  }, [isMobile, toggleSidebar]);

  return <SidebarMenuButtonLibrary onClick={menuOnClickCallback} {...props} />;
};

export const NavSecondary = ({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) => (
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
