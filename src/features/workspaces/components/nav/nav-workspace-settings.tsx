"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@components/ui/sidebar";
import DocumentSidebar from "@components/application/document/document-sidebar";
import routes from "@features/routes";
import { usePageTranslations } from "@hooks/use-page-translations";
import { getMenuItem } from "@lib/ui";

interface NavWorkspaceSettingsProps {
  organizationKey: string;
  hideGroupLabel?: boolean;
}

export const NavWorkspaceSettings = ({
  organizationKey,
  hideGroupLabel = false,
}: NavWorkspaceSettingsProps) => {
  const pathname = usePathname();
  const settingsTranslations = usePageTranslations(routes.workspaces.pages.settings);
  const workspaceTranslations = usePageTranslations(routes.workspaces.pages.settings_workspace);
  const invitationsTranslations = usePageTranslations(routes.workspaces.pages.settings_invitations);
  const usersTranslations = usePageTranslations(routes.workspaces.pages.settings_users);
  const teamsTranslations = usePageTranslations(routes.workspaces.pages.settings_teams);
  const rolesTranslations = usePageTranslations(routes.workspaces.pages.settings_roles);

  const navItems = [
    getMenuItem(routes.workspaces.pages.settings_workspace, workspaceTranslations.title, {
      organizationKey,
    }),
    getMenuItem(routes.workspaces.pages.settings_invitations, invitationsTranslations.title, {
      organizationKey,
    }),
    getMenuItem(routes.workspaces.pages.settings_users, usersTranslations.title, {
      organizationKey,
    }),
    getMenuItem(routes.workspaces.pages.settings_teams, teamsTranslations.title, {
      organizationKey,
    }),
    getMenuItem(routes.workspaces.pages.settings_roles, rolesTranslations.title, {
      organizationKey,
    }),
  ];

  return (
    <DocumentSidebar
      className="w-full shrink-0 md:w-64"
      headerName={!hideGroupLabel ? settingsTranslations.title : undefined}
    >
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton isActive={pathname === item.url} asChild>
              <Link href={item.url}>
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
