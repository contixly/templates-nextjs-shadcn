import appRoutes from "../../src/features/routes";

export const routes = {
  home: appRoutes.application.pages.home.path(),
  login: appRoutes.accounts.pages.login.path(),
} as const;
