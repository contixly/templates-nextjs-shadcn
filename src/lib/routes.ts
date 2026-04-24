import { Page } from "@typings/pages";
import routes, { AppRoutes } from "@features/routes";
import { BOT_AGENTS } from "@lib/environment";

/**
 * Find a route by its path in the application routes
 * @param pathname - The current pathname to match
 * @returns The matching page route or null if not found
 */
export const findRouteByPath = (pathname?: string | null): Page | null => {
  if (!pathname) return null;

  // Normalize pathname (remove the trailing slash if it's not the root path)
  const normalizedPathname = pathname === "/" ? pathname : pathname.replace(/\/$/, "");

  // Collect all pages from all features
  const allPages: Page[] = [];
  for (const featureKey of Object.keys(routes) as Array<keyof AppRoutes>) {
    const feature = routes[featureKey];
    for (const pageKey of Object.keys(feature.pages)) {
      allPages.push((feature.pages as Record<string, Page>)[pageKey]);
    }
  }

  // 1. Check for the exact match first (prioritize static routes)
  for (const page of allPages) {
    const normalizedRoutePath =
      page.pathTemplate === "/" ? page.pathTemplate : page.pathTemplate.replace(/\/$/, "");

    if (normalizedRoutePath === normalizedPathname) {
      return page;
    }
  }

  // 2. Check for dynamic path match
  for (const page of allPages) {
    const normalizedRoutePath =
      page.pathTemplate === "/" ? page.pathTemplate : page.pathTemplate.replace(/\/$/, "");

    if (normalizedRoutePath.includes("[")) {
      // Convert the path template to a regex pattern
      // 1. Escape regex special characters
      // 2. Replace [...slug] (catch-all) with (.+)
      // 3. Replace [param] with ([^/]+)
      const regexPattern = normalizedRoutePath
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\[\\\.{3}.*?\\]/g, "(.+)")
        .replace(/\\\[.*?\\]/g, "([^/]+)");

      const pathRegex = new RegExp(`^${regexPattern}$`);

      if (pathRegex.test(normalizedPathname)) {
        return page;
      }
    }
  }

  return null;
};

/**
 * Sanitizes a given redirect path to ensure it is safe and conforms to expected restrictions.
 *
 * This function performs the following operations to sanitize the path:
 * - Strips any protocol or domain information.
 * - Ensures the resulting path starts with a forward slash ("/"), making it a relative path.
 * - Removes directory traversal sequences ("..") to prevent access to unintended file paths.
 * - Limits the length of the path to a maximum of 2048 characters to mitigate potential abuse.
 *
 * @param {string} path - The redirect path to sanitize.
 * @returns {string} - A sanitized version of the redirect path.
 */
export const sanitizeRedirectPath = (path: string): string => {
  // Remove any protocol or domain information
  const cleanPath = path.replace(/^[^:]*:\/\/[^/]*\//, "/");

  // Prevent directory traversal attacks
  const normalizedPath = cleanPath.replace(/\.\./g, "");

  // Ensure it's a relative path starting with /
  // Re-check protocol-relative form after normalization to avoid bypasses such as `/..//host`
  if (!normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
    return "/";
  }

  // Limit path length to prevent abuse
  return normalizedPath.length > 2048 ? "/" : normalizedPath;
};

/**
 * Determines if the incoming request is from an original generation (OG) bot.
 *
 * @param {Headers} headers - A Headers object containing the HTTP request headers.
 * @returns {boolean} - Returns true if the user-agent in the headers matches known bot patterns, false otherwise.
 */
export const detectOGBots = (headers: Headers): boolean => {
  const userAgent = headers.get("user-agent") || "";
  return BOT_AGENTS.test(userAgent);
};
