export const locales = ["en", "ru"] as const;

export type AppLocale = (typeof locales)[number];

export const DefaultLocale: AppLocale = "en";

/**
 * Represents a function type for providing translations in an application.
 *
 * The `AnyTranslationsFn` type is used to retrieve a translated string based
 * on a given key and optional translation options.
 *
 * @callback AnyTranslationsFn
 * @param {string} key - The unique identifier for the translation string.
 * @param {object} [options] - An optional parameter object containing additional
 *                             data or interpolation variables required for the translation.
 * @returns {string} The translated string corresponding to the provided key.
 */
export type AnyTranslationsFn = (key: string, options?: object) => string;

export const isAppLocale = (value: string): value is AppLocale =>
  locales.includes(value as AppLocale);

export const resolveAppLocale = (value?: string | null): AppLocale => {
  if (!value) return (process.env.PUBLIC_DEFAULT_LOCALE ?? DefaultLocale) as AppLocale;
  return isAppLocale(value) ? value : DefaultLocale;
};
