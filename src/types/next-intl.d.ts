import type { AppLocale } from "@/src/i18n/config";
import type { I18nMessages } from "@/src/i18n/messages";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: I18nMessages;
  }
}
