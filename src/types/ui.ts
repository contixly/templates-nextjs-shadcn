import { Icon } from "@tabler/icons-react";

/**
 * Defines a type PropsWithClassName that includes an optional property for a CSS class name.
 * This is typically used to pass a `className` string to a component, allowing for custom styling.
 */
export type PropsWithClassName = {
  className?: string;
};

/**
 * Represents an item in a menu, typically used for navigation or actions.
 *
 * @interface MenuItem
 * @property {string} label - The text displayed on the menu item.
 * @property {string} url - The URL or target associated with the menu item.
 * @property {Icon} [icon] - An optional icon associated with the menu item.
 */
export interface MenuItem {
  label: string;
  url: string;
  icon?: Icon;
}
