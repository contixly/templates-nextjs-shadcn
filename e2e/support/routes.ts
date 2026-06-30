import appRoutes from "../../src/features/routes";

export const routes = {
  home: appRoutes.application.pages.home.path(),
  login: appRoutes.accounts.pages.login.path(),
  welcome: appRoutes.accounts.pages.welcome.path(),
  localAutomationScenario: "/api/local-auth/scenario",
} as const;
