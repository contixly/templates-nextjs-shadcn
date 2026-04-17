import { getTranslations } from "next-intl/server";
import type { _Translator } from "use-intl/core";
import type { I18nMessages } from "@/src/i18n/messages";
import type { Page, PageNamespace } from "@typings/pages";

export type PageTranslations = Readonly<{
  title: string;
  description?: string;
  openGraphTitle: string;
  openGraphDescription?: string;
}>;

type PageTranslator = _Translator<I18nMessages, PageNamespace>;

const resolvePageTranslations = (t: PageTranslator): PageTranslations => {
  const title = t("title");
  const description = t.has("description") ? t("description") : undefined;

  return {
    title,
    description,
    openGraphTitle: t.has("openGraph.title") ? t("openGraph.title") : title,
    openGraphDescription: t.has("openGraph.description") ? t("openGraph.description") : description,
  };
};

export const getPageTranslations = async (page: Page): Promise<PageTranslations> => {
  const translator = await getTranslations(page.i18n.namespace);
  return resolvePageTranslations(translator);
};

export { resolvePageTranslations };
