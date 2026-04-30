import "server-only";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * Revalidates a list of tags using a specified profile.
 *
 * @param {string[]} tags - An array of tags to be revalidated.
 * @param {string} [profile="max"] - The profile to use for revalidation. Defaults to "max" if not provided.
 */
export const revalidateTags = (tags: string[], profile: string = "max") =>
  tags.forEach((tag) => revalidateTag(tag, profile));

/**
 * Revalidates a set of paths based on the provided type.
 *
 * @param {string[]} paths - An array of paths to be revalidated.
 * @param {"layout" | "page"} [type] - An optional type indicating the revalidation context,
 *                                    either "layout" or "page".
 */
export const revalidatePaths = (paths: string[], type?: "layout" | "page") =>
  paths.forEach((path) => revalidatePath(path, type));

/**
 * Updates a collection of tags by iterating through the provided array
 * and invoking a predefined function to process each tag individually.
 *
 * @param {string[]} tags - An array of strings representing the tags to be updated.
 */
export const updateTags = (tags: string[]) => tags.forEach((tag) => updateTag(tag));
