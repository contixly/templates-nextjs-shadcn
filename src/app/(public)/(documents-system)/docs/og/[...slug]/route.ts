import { Metadata } from "next";
import {
  getCachedDocuments,
} from "@features/documents-system/documents-system-actions";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import routes from "@features/routes";
import { buildMetadataOGImage } from "@lib/metadata-og";

export async function generateStaticParams() {
  return documentsSystemTools.buildStaticParams(await getCachedDocuments());
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string[] }>;
  },
) {
  const { slug } = await params;
  const currentPath = slug.join("/");
  const document = documentsSystemTools.findDocument(await getCachedDocuments(), currentPath);

  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  return buildMetadataOGImage(
    {
      title: document.meta.title,
      description: document.meta.description,
    } satisfies Metadata,
    routes.documents_system.featureName,
  );
}
