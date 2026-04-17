import commonEn from "@messages/common.en.json";
import accountsEn from "@messages/features/accounts.en.json";
import workspacesEn from "@messages/features/workspaces.en.json";
import applicationEn from "@messages/features/application.en.json";
import dashboardEn from "@messages/features/dashboard.en.json";
import { AppLocale, resolveAppLocale } from "@/src/i18n/config";

export type I18nMessages = {
  common: typeof commonEn;
  accounts: typeof accountsEn;
  workspaces: typeof workspacesEn;
  application: typeof applicationEn;
  dashboard: typeof dashboardEn;
};

export const loadMessages = async (locale: AppLocale): Promise<I18nMessages> => {
  const [common, accounts, workspaces, application, dashboard] = await Promise.all([
    import(`../messages/common.${locale}.json`).then((module) => module.default),
    import(`../messages/features/accounts.${locale}.json`).then((module) => module.default),
    import(`../messages/features/workspaces.${locale}.json`).then((module) => module.default),
    import(`../messages/features/application.${locale}.json`).then((module) => module.default),
    import(`../messages/features/dashboard.${locale}.json`).then((module) => module.default),
  ]);

  return {
    common,
    accounts,
    workspaces,
    application,
    dashboard,
  };
};

export const loadI18nMessagesConfig = async (requestLocale?: AppLocale | null) => {
  const locale = resolveAppLocale(requestLocale);

  return {
    locale,
    messages: await loadMessages(locale),
  };
};
