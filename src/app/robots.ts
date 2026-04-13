import type { MetadataRoute } from "next";
import { APP_BASE_URL } from "@lib/environment";

/**
 * This function generates a robots.txt file for the template application.
 * It allows public access to the home page while protecting authenticated and private areas.
 *
 * @returns {MetadataRoute.Robots} The robots.txt configuration.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "*",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${APP_BASE_URL}/sitemap.xml`,
  };
}
