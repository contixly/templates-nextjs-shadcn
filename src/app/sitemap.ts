import { MetadataRoute } from "next";
import { getCachedDocuments } from "@features/documents-system/documents-system-actions";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import routes from "@features/routes";
import { APP_BASE_URL } from "@lib/environment";

const toAbsoluteUrl = (path: string) => `${APP_BASE_URL}${path}`;

const addSitemapEntry = (
  entriesByUrl: Map<string, MetadataRoute.Sitemap[number]>,
  entry: MetadataRoute.Sitemap[number]
) => {
  if (!entriesByUrl.has(entry.url)) {
    entriesByUrl.set(entry.url, entry);
  }
};

/**
 * Generates the sitemap for the application by programmatically
 * iterating through all defined routes and their pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entriesByUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  const lastModified = new Date();

  // Iterate through all features and their pages
  for (const feature of Object.values(routes)) {
    for (const page of Object.values(feature.pages)) {
      // Dynamic routes (containing [brackets]) require actual data
      // to generate valid URLs. For now, we only include static routes.
      if (page.pathTemplate.includes("[")) {
        continue;
      }

      addSitemapEntry(entriesByUrl, {
        url: toAbsoluteUrl(page.pathTemplate),
        lastModified,
        changeFrequency: "monthly",
        priority: page.pathTemplate === "/" ? 1.0 : 0.8,
      });
    }
  }

  const documents = await getCachedDocuments();

  for (const document of documents) {
    addSitemapEntry(entriesByUrl, {
      url: toAbsoluteUrl(documentsSystemTools.documentUrlToHref(document.url)),
      lastModified: document.meta.editedAt ?? lastModified,
      changeFrequency: "weekly",
      priority: document.url === "index" ? 0.8 : 0.6,
    });
  }

  return [...entriesByUrl.values()];
}
