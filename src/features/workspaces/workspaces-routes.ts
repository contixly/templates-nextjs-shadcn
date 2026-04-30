import { Feature } from "@typings/pages";
import { buildFeature } from "@lib/pages";
import {
  IconMail,
  IconSettings,
  IconShield,
  IconTableShare,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

export type WorkspaceSettingsPages =
  | "settings_workspace"
  | "settings_invitations"
  | "settings_users"
  | "settings_teams"
  | "settings_roles";

type WorkspacesPages = "workspaces" | "workspace" | "settings" | WorkspaceSettingsPages;

export type WorkspaceRoutes = Feature<WorkspacesPages>;

const workspaceRoutes: WorkspaceRoutes = buildFeature<WorkspacesPages>("workspaces", {
  pages: {
    workspaces: {
      pathTemplate: "/workspaces",
      icon: IconTableShare,

      breadcrumbs: {
        hideTemplateDescription: true,
      },
    },
    workspace: {
      pathTemplate: "/w/[organizationKey]",
    },
    settings: {
      parent: "workspace",
      pathTemplate: "/w/[organizationKey]/settings",
      hidePageHeader: true,
    },
    settings_workspace: {
      parent: "workspace",
      pathTemplate: "/w/[organizationKey]/settings/workspace",
      icon: IconSettings,
      hidePageHeader: true,
    },
    settings_invitations: {
      parent: "workspace",
      pathTemplate: "/w/[organizationKey]/settings/invitations",
      icon: IconMail,
      hidePageHeader: true,
    },
    settings_users: {
      parent: "workspace",
      pathTemplate: "/w/[organizationKey]/settings/users",
      icon: IconUsers,
      hidePageHeader: true,
    },
    settings_teams: {
      parent: "workspace",
      pathTemplate: "/w/[organizationKey]/settings/teams",
      icon: IconUsersGroup,
      hidePageHeader: true,
    },
    settings_roles: {
      parent: "workspace",
      pathTemplate: "/w/[organizationKey]/settings/roles",
      icon: IconShield,
      hidePageHeader: true,
    },
  },
});

export default workspaceRoutes;
