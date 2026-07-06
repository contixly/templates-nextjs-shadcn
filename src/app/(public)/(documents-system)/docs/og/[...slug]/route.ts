import { Metadata } from "next";
import { resolveAppLocale } from "@/src/i18n/config";
import { getCachedDocuments } from "@features/documents-system/documents-system-actions";
import { resolveDocumentsSystemDefaultContentLocale } from "@features/documents-system/documents-system-locale-tools";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import routes from "@features/routes";
import { buildMetadataOGImage } from "@lib/metadata-og";

export async function generateStaticParams() {
  return documentsSystemTools.buildStaticParams(
    await getCachedDocuments(resolveDocumentsSystemDefaultContentLocale())
  );
}

const getRequestLocale = (request: Request) => {
  const locale = new URL(request.url).searchParams.get("locale");

  return locale ? resolveAppLocale(locale) : resolveDocumentsSystemDefaultContentLocale();
};

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string[] }>;
  },
) {
  const { slug } = await params;
  const currentPath = slug.join("/");
  const locale = getRequestLocale(request);
  const document = documentsSystemTools.findDocument(
    await getCachedDocuments(locale),
    currentPath
  );

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
