import {
  Feature,
  FeatureDescription,
  Page,
  PageDescription,
  PageNamespace,
  PathMatchesRecord,
} from "@typings/pages";

/**
 * Generates a complete path by replacing placeholders in a path template with their corresponding values.
 *
 * This function takes a template string containing placeholders in the format `{key}`
 * and replaces them with the values provided in the `matches` object. If any placeholders
 * remain unresolved after substitution, an error is thrown.
 *
 * @param {string} pathTemplate - The string template containing placeholders for path parameters.
 * @param {Object<string, string>} [matches] - The mapping object where keys correspond to placeholder names in the template
 * and values are the replacements for these placeholders. If omitted, the template is returned unchanged.
 * @throws {Error} Throws an error if there are unresolved placeholders in the resulting path.
 */
const pathBuilder = (pathTemplate: string, matches?: PathMatchesRecord) => {
  if (!matches) return pathTemplate;

  let path = pathTemplate;
  Object.entries(matches).forEach(([key, value]) => {
    if (value) path = path.replace(`[${key}]`, value.toString());
  });

  const remainingPatternRegex = /\[[^\]]+]/;
  if (remainingPatternRegex.test(path)) {
    throw new Error(`Path "${path}" contains unresolved pattern matches`);
  }

  if (matches?.query && typeof matches.query === "object") {
    path += `?${Object.entries(matches.query)
      .map(([key, value]) => `${key}=${value}`)
      .join("&")}`;
  }

  return path;
};

/**
 * Transforms a record of pages by enhancing each entry with localization keys and a path builder function.
 *
 * @template T - A string literal type representing the keys of the pages.
 *
 * @param {Record<T, PageDescription>} pages - A record where keys are the page identifiers and values are the page descriptions.
 *
 * @param {string} featureName - The name of the feature associated with the pages.
 * @returns {Record<T, Page>} A transformed record where each page now includes localization keys and a function to generate paths based on the specified path template.
 */
const getPages = <T extends string>(
  pages: Record<T, PageDescription<T>>,
  featureName: string
): Record<T, Page> =>
  (() => {
    type AssembledPage = Omit<Page, "parent"> & { parent?: T };

    const pageEntries = Object.entries(pages) as Array<[T, PageDescription<T>]>;
    const assembled = {} as Record<T, AssembledPage>;
    for (const [pageKey, page] of pageEntries) {
      assembled[pageKey] = {
        ...page,
        path: (matches?: PathMatchesRecord) => pathBuilder(page.pathTemplate, matches),
        featureName,
        pageKey,
        i18n: {
          namespace: `${featureName}.pages.${pageKey}` as PageNamespace,
        },
      } as AssembledPage;
    }

    const resolved = {} as Record<T, Page>;
    for (const [pageKey, page] of Object.entries(assembled) as Array<[T, AssembledPage]>) {
      if (!page.parent) {
        resolved[pageKey] = page as Page;
        continue;
      }

      const parent = assembled[page.parent];

      if (!parent) {
        throw new Error(`Unknown parent page "${page.parent}" for "${featureName}.${pageKey}"`);
      }

      resolved[pageKey] = { ...page, parent } as Page;
    }

    return resolved;
  })();

/**
 * Constructs a feature object by extending the provided feature description.
 *
 * @template T - The type representing the feature identifier.
 * @template K - The type representing the page identifiers within the feature.
 * @param {string} featureName - The name of the feature.
 * @param {FeatureDescription<T, K>} featureDescription - The description of the feature, including its metadata and associated pages.
 * @returns {Feature<T, K>} The resulting feature object containing the description and processed pages.
 */
export const buildFeature = <T extends string>(
  featureName: string,
  featureDescription: FeatureDescription<T>
): Feature<T> => ({
  pages: getPages(featureDescription.pages, featureName),
  featureName,
});
