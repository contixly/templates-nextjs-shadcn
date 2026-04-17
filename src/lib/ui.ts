import { Page, PathMatchesRecord } from "@typings/pages";
import { MenuItem } from "@typings/ui";

/**
 * Generates a menu item object containing metadata for a navigation element.
 *
 * @param {Page} page - The Page object containing information about the menu item.
 * @param {string} label - The explicit menu label to display.
 * @param {PathMatchesRecord} [params] - Optional parameters to resolve dynamic parts of the page path.
 * @returns {Object} A menu item object with the following properties:
 *   - label: The label of the menu item.
 *   - url: The resolved URL of the menu item, based on the page path and optional parameters.
 *   - icon: The icon associated with the menu item, derived from the page object.
 */
export const getMenuItem = (page: Page, label: string, params?: PathMatchesRecord): MenuItem => {
  const resolvedLabel = label.trim();

  if (!resolvedLabel) {
    throw new Error(`Missing menu item label for "${page.featureName}.${page.pageKey}"`);
  }

  return {
    label: resolvedLabel,
    url: page.path(params),
    icon: page.icon,
  };
};
