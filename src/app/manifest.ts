import type { MetadataRoute } from "next";
import { GlobalMetadata } from "@lib/metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: GlobalMetadata.applicationName as string,
    short_name: "Template",
    description: GlobalMetadata.description as string,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/img/branding/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/img/branding/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    categories: ["productivity", "business", "developer-tools"],
    orientation: "any",
    scope: "/",
  };
}
