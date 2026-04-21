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

type WorkspacesPages =
  | "workspaces"
  | "workspace"
  | "settings"
  | "settings_workspace"
  | "settings_invitations"
  | "settings_users"
  | "settings_teams"
  | "settings_roles";
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
      pathTemplate: "/[organizationKey]",
    },
    settings: {
      parent: "workspace",
      pathTemplate: "/[organizationKey]/settings",
      hidePageHeader: true,
    },
    settings_workspace: {
      parent: "workspace",
      pathTemplate: "/[organizationKey]/settings/workspace",
      icon: IconSettings,
      hidePageHeader: true,
    },
    settings_invitations: {
      parent: "workspace",
      pathTemplate: "/[organizationKey]/settings/invitations",
      icon: IconMail,
      hidePageHeader: true,
    },
    settings_users: {
      parent: "workspace",
      pathTemplate: "/[organizationKey]/settings/users",
      icon: IconUsers,
      hidePageHeader: true,
    },
    settings_teams: {
      parent: "workspace",
      pathTemplate: "/[organizationKey]/settings/teams",
      icon: IconUsersGroup,
      hidePageHeader: true,
    },
    settings_roles: {
      parent: "workspace",
      pathTemplate: "/[organizationKey]/settings/roles",
      icon: IconShield,
      hidePageHeader: true,
    },
  },
});

export default workspaceRoutes;
