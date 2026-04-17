import { PartialRecord } from "@typings/common";
import { Icon } from "@tabler/icons-react";
import type { I18nMessages } from "@/src/i18n/messages";

export type PathParametersType = "workspaceId" | "query";
export type PageNamespace = {
  [FeatureName in keyof I18nMessages]: I18nMessages[FeatureName] extends {
    pages: infer Pages;
  }
    ? `${Extract<FeatureName, string>}.pages.${Extract<keyof Pages, string>}`
    : never;
}[keyof I18nMessages];

/**
 * Represents the structure and metadata for the description of a page in an application.
 *
 * This type is immutable and can define various properties of a page, including its path,
 * title, description, icon, visibility of elements, and breadcrumb behavior.
 *
 * Properties:
 * - `pathTemplate`: The template string defining the path for this page.
 * - `parent`: An optional reference to a parent page key, establishing a hierarchical relationship.
 * - `selfParent`: A boolean flag indicating whether this page is the parent of itself.
 * - `title`: The title of the page, which is required and intended for display purposes.
 * - `description`: An optional description providing additional context about the page.
 * - `icon`: An optional icon associated with the page, typically indicating its purpose or function.
 * - `hidePageHeader`: If true, the page header should not be displayed on this page.
 * - `hidePageHeaderOnMobile`: If true, the page header should not be displayed on mobile devices.
 * - `breadcrumbs`: An optional object defining customization options for breadcrumbs:
 *   - `hideBreadcrumbs`: If true, breadcrumbs should not be displayed on this page.
 *   - `hideTemplateTitle`: If true, the breadcrumbs should exclude the title derived from the path template.
 *   - `hideTemplateDescription`: If true, the breadcrumbs should exclude the description derived from the path template.
 * - `openGraph`: An optional object defining Open Graph metadata for the page:
 *   - `title`: The title to be used for Open Graph metadata.
 *   - `description`: The description to be used for Open Graph metadata.
 */
export type PageDescription<T extends string = string> = Readonly<{
  pathTemplate: string;
  parent?: T;
  selfParent?: boolean;

  title?: string;
  description?: string;
  icon?: Icon;

  hidePageHeader?: boolean;
  hidePageHeaderOnMobile?: boolean;

  breadcrumbs?: {
    hideBreadcrumbs?: boolean;
    hideTemplateTitle?: boolean;
    hideTemplateDescription?: boolean;
  };

  openGraph?: {
    title?: string;
    description?: string;
  };
}>;

/**
 * Represents a structure to define feature-specific routes for a web application.
 * This includes both page routes and API endpoints.
 *
 * @template T - A string literal type indicating the keys for page routes.
 *
 * @property {Record<T, PageDescription>} pages - A mapping of keys to page route configurations.
 */
export type FeatureDescription<T extends string> = Readonly<{
  pages: Record<T, PageDescription<T>>;
}>;

/**
 * Represents a record type where the keys are of a specified `PathMatchesSegmentType`
 * and the values can be strings, undefined, or null. This type is defined as a
 * partial record, meaning that not all possible keys need to be present in an object
 * of this type, and the properties are optional.
 *
 * Used to map specific path match segments to their corresponding string values or
 * denote the absence of a value (via undefined or null).
 */
export type PathMatchesRecord = PartialRecord<
  PathParametersType,
  string | undefined | null | PartialRecord<string, string>
>;

/**
 * Represents a page in the application with a specific path and associated feature name.
 * Extends from the PageDescription interface to provide additional details for the page.
 *
 * @interface Page
 * @extends PageDescription
 *
 * @property {function(PathMatchesRecord=): string} path - A function that returns the URL path for the page.
 *     Optionally accepts a record of path matches to dynamically generate the path.
 *
 * @property {string} featureName - The name of the feature associated with this page.
 */
export interface Page extends Omit<PageDescription, "parent"> {
  readonly path: (matches?: PathMatchesRecord) => string;
  readonly featureName: string;
  readonly pageKey: string;
  readonly i18n: {
    readonly namespace: PageNamespace;
  };
  readonly parent?: Page;
}

/**
 * Represents a feature with a defined type and associated pages.
 *
 * @template T - A string type representing the keys for the feature's pages.
 *
 * @extends Omit<FeatureDescription<T>, "pages">
 * This interface inherits all properties from `FeatureDescription<T>`
 * except the `pages` property.
 *
 * @property {Record<T, Page>} pages - A record mapping keys of type `T` to `Page` objects.
 * @property {string} featureName - The name of the feature.
 */
export interface Feature<T extends string> extends Omit<FeatureDescription<T>, "pages"> {
  readonly pages: Record<T, Page>;
  readonly featureName: string;
}
