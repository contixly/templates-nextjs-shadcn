import appRoutes from "../../src/features/routes";

export const routes = {
  home: appRoutes.application.pages.home.path(),
  login: appRoutes.accounts.pages.login.path(),
  welcome: appRoutes.accounts.pages.welcome.path(),
  personalApiKeys: appRoutes.accounts.pages.api_keys.path(),
  workspaces: appRoutes.workspaces.pages.workspaces.path(),
  workspace: (organizationKey: string) =>
    appRoutes.workspaces.pages.workspace.path({ organizationKey }),
  organizationDashboard: (organizationKey: string) =>
    appRoutes.dashboard.pages.organization_dashboard.path({ organizationKey }),
  workspaceSettingsWorkspace: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_workspace.path({ organizationKey }),
  workspaceSettingsApiKeys: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_api_keys.path({ organizationKey }),
  workspaceSettingsUsers: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_users.path({ organizationKey }),
  apiV1Me: "/api/v1/me",
  apiV1Organizations: "/api/v1/organizations",
  apiV1Organization: (organizationId: string) => `/api/v1/organizations/${organizationId}`,
  apiV1OrganizationMembers: (organizationId: string) =>
    `/api/v1/organizations/${organizationId}/members`,
  localAutomationScenario: "/api/local-auth/scenario",
} as const;
