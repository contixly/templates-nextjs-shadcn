"use client";

import { useTranslations } from "next-intl";
import { resolvePageTranslations } from "@lib/page-translations";
import { Page } from "@typings/pages";

export const usePageTranslations = (page: Page) =>
  resolvePageTranslations(useTranslations(page.i18n.namespace));
