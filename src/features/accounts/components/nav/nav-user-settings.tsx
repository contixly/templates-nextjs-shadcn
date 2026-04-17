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
import { usePageTranslations } from "@hooks/use-page-translations";

export const NavUserSettings = ({ hideGroupLabel = false }: { hideGroupLabel?: boolean }) => {
  const path = usePathname();
  const searchQueryState = useState("");
  const [searchQuery] = searchQueryState;
  const userTranslations = usePageTranslations(routes.accounts.pages.user);
  const profileTranslations = usePageTranslations(routes.accounts.pages.profile);
  const connectionsTranslations = usePageTranslations(routes.accounts.pages.connections);
  const securityTranslations = usePageTranslations(routes.accounts.pages.security);
  const dangerTranslations = usePageTranslations(routes.accounts.pages.danger);

  const navItems = [
    getMenuItem(routes.accounts.pages.profile, profileTranslations.title),
    getMenuItem(routes.accounts.pages.connections, connectionsTranslations.title),
    getMenuItem(routes.accounts.pages.security, securityTranslations.title),
    { ...getMenuItem(routes.accounts.pages.danger, dangerTranslations.title), isDanger: true },
  ] as (MenuItem & { isDanger?: boolean })[];

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DocumentSidebar
      className="w-full shrink-0 md:w-64"
      headerName={!hideGroupLabel ? userTranslations.title : undefined}
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
