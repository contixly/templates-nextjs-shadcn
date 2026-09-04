import type { Metadata } from "next";
import { resolveOpenGraphLocale, GlobalOpenGraph, GlobalTwitter } from "@lib/metadata";
import { OG_IMAGE_SIZE } from "@lib/metadata-og-constants";
import { DocumentsSystemRouteRoot } from "./documents-system-routes";

type DocumentsSystemMetadataInput = {
  title: string;
  description: string;
  currentPath: string;
  locale: string;
};

export const buildDocumentsSystemMetadata = ({
  title,
  description,
  currentPath,
  locale,
}: DocumentsSystemMetadataInput): Metadata => {
  const canonicalUrl =
    currentPath === "index"
      ? DocumentsSystemRouteRoot
      : `${DocumentsSystemRouteRoot}/${currentPath}`;
  const imageUrl = `${DocumentsSystemRouteRoot}/og/${currentPath}?locale=${encodeURIComponent(locale)}`;
  const image = {
    url: imageUrl,
    ...OG_IMAGE_SIZE,
    type: "image/png",
    alt: title,
  };

  return {
    title,
    description,
    openGraph: {
      ...GlobalOpenGraph,
      locale: resolveOpenGraphLocale(locale),
      url: canonicalUrl,
      title,
      description,
      images: [image],
    },
    twitter: {
      ...GlobalTwitter,
      title,
      description,
      images: [image],
    },
  };
};
