import { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";
import { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { Metadata } from "next";
import { APP_BASE_URL } from "@lib/environment";
import { getPageTranslations } from "@lib/page-translations";
import { Page, PathMatchesRecord } from "@typings/pages";

export const SITE_NAME = "Application Template";

const baseOpenGraph: OpenGraph = {
  type: "website",
  locale: "en_US",
  siteName: SITE_NAME,

  url: "/",
  title: SITE_NAME,
  description:
    "A neutral Next.js application template for building custom services with authentication, shared UI, and reusable patterns.",
};

const baseTwitter: Twitter = {
  card: "summary_large_image",
  creator: "@kroniak",

  title: SITE_NAME,
  description: baseOpenGraph.description,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | Application Template",
  },
  description: baseOpenGraph.description,
  keywords: [
    "next.js template",
    "application starter",
    "authenticated dashboard",
    "feature slice design",
    "server actions",
    "prisma",
    "tailwind css",
    "shadcn/ui",
  ],
  authors: [{ name: "Template Maintainers" }],
  creator: "Template Maintainers",
  publisher: "Template Maintainers",
  applicationName: SITE_NAME,
  openGraph: baseOpenGraph,
  twitter: baseTwitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

/**
 * Generates metadata for a given page, including settings for Open Graph and Twitter.
 *
 * @param {Page} page - The page object containing details such as title, description, and Open Graph data.
 * @param {PathMatchesRecord} [params] - Optional parameters containing path match information used for URL generation.
 * @returns {Metadata} An object representing the metadata, including title, description, Open Graph, and Twitter configurations.
 */
export const buildMetadata = (page: Page, params?: PathMatchesRecord): Metadata => ({
  title: page.title,
  description: page.description,
  openGraph: {
    ...baseOpenGraph,
    title: page.openGraph?.title || page.title,
    description: page.openGraph?.description || page.description,
    url: page.path(params),
  },
  twitter: {
    ...baseTwitter,
    title: page.openGraph?.title || page.title,
    description: page.openGraph?.description || page.description,
  },
});

export const buildPageMetadata = async (
  page: Page,
  params?: PathMatchesRecord
): Promise<Metadata> => {
  const { title, description, openGraphTitle, openGraphDescription } =
    await getPageTranslations(page);

  return {
    title,
    description,
    openGraph: {
      ...baseOpenGraph,
      title: openGraphTitle,
      description: openGraphDescription,
      url: page.path(params),
    },
    twitter: {
      ...baseTwitter,
      title: openGraphTitle,
      description: openGraphDescription,
    },
  };
};

export {
  metadata as GlobalMetadata,
  baseTwitter as GlobalTwitter,
  baseOpenGraph as GlobalOpenGraph,
};
