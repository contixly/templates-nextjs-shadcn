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
  title: "Account Settings",
};

const accountsRoutes: AccountsRoutes = buildFeature("accounts", {
  pages: {
    login: {
      pathTemplate: "/auth/login",
      icon: IconLogin,

      title: "Sign In",
      description: "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
      openGraph: {
        title: "Sign In",
        description: "Access the template application securely with Google or GitHub OAuth.",
      },
    },
    error: {
      pathTemplate: "/auth/error",
      title: "Error",
      description: "An error occurred. Please try again later.",
      openGraph: {
        title: "Error",
        description: "An error occurred during authentication. Please try again.",
      },
    },
    user,
    welcome: {
      pathTemplate: "/welcome",

      hidePageHeader: true,
      hidePageHeaderOnMobile: true,

      title: "Welcome",
      description:
        "Get started with the template — authentication, workspaces, and patterns you can adapt to your product.",
      openGraph: {
        title: "Welcome",
        description: "Your account is ready. Explore the template structure and start customizing.",
      },
    },
    profile: {
      parent: user,
      pathTemplate: "/user/profile",
      icon: IconUser,

      hidePageHeader: true,

      title: "Profile Settings",
      description:
        "Manage your profile settings including your display name, avatar, and preferences.",
      openGraph: {
        title: "Profile Settings",
        description: "Update your profile information and personal preferences.",
      },
    },
    connections: {
      parent: user,
      pathTemplate: "/user/connections",
      icon: IconLink,

      hidePageHeader: true,

      title: "Connected Accounts",
      description:
        "Manage your connected OAuth providers including Google and GitHub. Link or unlink accounts for seamless authentication.",
      openGraph: {
        title: "Connected Accounts",
        description: "Link and manage your Google and GitHub accounts for authentication.",
      },
    },
    security: {
      parent: user,
      pathTemplate: "/user/security",
      icon: IconShield,

      hidePageHeader: true,

      title: "Security & Sessions",
      description:
        "Manage your active sessions, view login history, and control your account security settings.",
      openGraph: {
        title: "Security & Sessions",
        description: "Review and manage your active sessions and account security.",
      },
    },
    danger: {
      parent: user,
      pathTemplate: "/user/danger",
      icon: IconAlertTriangle,

      hidePageHeader: true,

      title: "Danger Zone",
      description:
        "Account deletion and other dangerous operations. Proceed with caution — these actions cannot be undone.",
      openGraph: {
        title: "Danger Zone",
        description: "Manage irreversible account operations including account deletion.",
      },
    },
  },
});

export default accountsRoutes;
