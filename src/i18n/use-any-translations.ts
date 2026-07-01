import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { AnyTranslationsFn } from "@/src/i18n/config";

type UntypedUseTranslations = (namespace?: string) => AnyTranslationsFn;
const useUntypedTranslations = useTranslations as unknown as UntypedUseTranslations;

/**
 * A utility function that wraps the usage of translations from a specified namespace.
 * This function provides a translation function `t` to retrieve translations for any given key.
 *
 * @param {string} [namespace] - The optional namespace to scope the translations. If not provided, translations are not namespace-scoped.
 * @returns {Function} A function that takes a translation key (`anyKey`) as a string and returns the corresponding translated value.
 */
export const useAnyTranslations = (namespace?: string): AnyTranslationsFn => {
  const t = useUntypedTranslations(namespace);

  return useCallback((anyKey: string, options?: object) => t(anyKey, options), [t]);
};
