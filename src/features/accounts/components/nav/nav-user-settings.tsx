"use client";

import routes from "@features/routes";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@components/ui/sidebar";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@lib/utils";
import DocumentSidebar from "@components/application/document/document-sidebar";
import { getMenuItem } from "@lib/ui";
import { MenuItem } from "@typings/ui";

const navItems = [
  getMenuItem(routes.accounts.pages.profile),
  getMenuItem(routes.accounts.pages.connections),
  getMenuItem(routes.accounts.pages.security),
  { ...getMenuItem(routes.accounts.pages.danger), isDanger: true },
] as (MenuItem & { isDanger?: boolean })[];

export const NavUserSettings = ({ hideGroupLabel = false }: { hideGroupLabel?: boolean }) => {
  const path = usePathname();
  const searchQueryState = useState("");
  const [searchQuery] = searchQueryState;

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DocumentSidebar
      className="w-full shrink-0 md:w-64"
      headerName={!hideGroupLabel ? "Account Settings" : undefined}
      searchQueryState={searchQueryState}
    >
      <SidebarMenu>
        {filteredNavItems.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton isActive={path === item.url} asChild>
              <Link
                href={item.url}
                className={cn({ "text-destructive": item.isDanger && path !== item.url })}
              >
                {item.icon && <item.icon className="size-4" />}
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </DocumentSidebar>
  );
};
