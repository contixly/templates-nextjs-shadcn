import { IconAlertTriangle, IconLink, IconLogin, IconShield, IconUser } from "@tabler/icons-react";
import { Feature } from "@typings/pages";
import { buildFeature } from "@lib/pages";

type AccountsPages =
  | "login"
  | "error"
  | "welcome"
  | "user"
  | "profile"
  | "connections"
  | "security"
  | "danger";

export type AccountsRoutes = Feature<AccountsPages>;

const user = {
  pathTemplate: "/user",
  icon: IconUser,
};

const accountsRoutes: AccountsRoutes = buildFeature<AccountsPages>("accounts", {
  pages: {
    login: {
      pathTemplate: "/auth/login",
      icon: IconLogin,
    },
    error: {
      pathTemplate: "/auth/error",
    },
    user,
    welcome: {
      pathTemplate: "/welcome",

      hidePageHeader: true,
      hidePageHeaderOnMobile: true,
    },
    profile: {
      parent: "user",
      pathTemplate: "/user/profile",
      icon: IconUser,

      hidePageHeader: true,
    },
    connections: {
      parent: "user",
      pathTemplate: "/user/connections",
      icon: IconLink,

      hidePageHeader: true,
    },
    security: {
      parent: "user",
      pathTemplate: "/user/security",
      icon: IconShield,

      hidePageHeader: true,
    },
    danger: {
      parent: "user",
      pathTemplate: "/user/danger",
      icon: IconAlertTriangle,

      hidePageHeader: true,
    },
  },
});

export default accountsRoutes;
