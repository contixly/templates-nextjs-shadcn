import appRoutes from "../../src/features/routes";

export const routes = {
  home: appRoutes.application.pages.home.path(),
  health: "/api/health",
  login: appRoutes.accounts.pages.login.path(),
  welcome: appRoutes.accounts.pages.welcome.path(),
  dashboard: appRoutes.dashboard.pages.application_dashboard.path(),
  accountSecurity: appRoutes.accounts.pages.security.path(),
  personalApiKeys: appRoutes.accounts.pages.api_keys.path(),
  accountInvitations: appRoutes.accounts.pages.invitations.path(),
  invitationDecision: (invitationId: string) =>
    appRoutes.accounts.pages.invitation.path({ invitationId }),
  workspaces: appRoutes.workspaces.pages.workspaces.path(),
  workspace: (organizationKey: string) =>
    appRoutes.workspaces.pages.workspace.path({ organizationKey }),
  organizationDashboard: (organizationKey: string) =>
    appRoutes.dashboard.pages.organization_dashboard.path({ organizationKey }),
  workspaceSettings: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings.path({ organizationKey }),
  workspaceSettingsWorkspace: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_workspace.path({ organizationKey }),
  workspaceSettingsInvitations: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_invitations.path({ organizationKey }),
  workspaceSettingsApiKeys: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_api_keys.path({ organizationKey }),
  workspaceSettingsUsers: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_users.path({ organizationKey }),
  workspaceSettingsTeams: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_teams.path({ organizationKey }),
  workspaceSettingsRoles: (organizationKey: string) =>
    appRoutes.workspaces.pages.settings_roles.path({ organizationKey }),
  apiV1Me: "/api/v1/me",
  apiV1Organizations: "/api/v1/organizations",
  apiV1Organization: (organizationId: string) => `/api/v1/organizations/${organizationId}`,
  apiV1OrganizationMembers: (organizationId: string) =>
    `/api/v1/organizations/${organizationId}/members`,
  apiV1OrganizationTeams: (organizationId: string) =>
    `/api/v1/organizations/${organizationId}/teams`,
  apiV1OrganizationTeamMembers: (organizationId: string, teamId: string) =>
    `/api/v1/organizations/${organizationId}/teams/${teamId}/members`,
  localAutomationScenario: "/api/local-auth/scenario",
} as const;
