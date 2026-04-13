import { MetadataRoute } from "next";
import routes from "@features/routes";
import { APP_BASE_URL } from "@lib/environment";

/**
 * Generates the sitemap for the application by programmatically
 * iterating through all defined routes and their pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Iterate through all features and their pages
  for (const feature of Object.values(routes)) {
    for (const page of Object.values(feature.pages)) {
      // Dynamic routes (containing [brackets]) require actual data
      // to generate valid URLs. For now, we only include static routes.
      if (page.pathTemplate.includes("[")) {
        continue;
      }

      entries.push({
        url: `${APP_BASE_URL}${page.pathTemplate}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: page.pathTemplate === "/" ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}
