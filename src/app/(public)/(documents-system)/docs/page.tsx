import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCachedDocumentsSystemRegistry,
  importDocumentModule,
} from "@features/documents-system/documents-system-actions";
import { getDocumentsSystemEnvironment } from "@features/documents-system/documents-system-runtime";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import { createDocumentsMdxComponents } from "@features/documents-system/ui/mdx/documents-mdx-components";
import { DocumentsSystemPage } from "@features/documents-system/ui/page/documents-system-page";

const DOCUMENT_URL = "index";

export async function generateMetadata(): Promise<Metadata | null> {
  const registry = await getCachedDocumentsSystemRegistry();
  const document = documentsSystemTools.findDocument(registry.visibleDocuments, DOCUMENT_URL);

  if (!document) {
    return null;
  }

  return {
    title: document.meta.title,
    description: document.meta.description,
  };
}

export default async function DocumentsSystemHomePage() {
  const registry = await getCachedDocumentsSystemRegistry();
  const document = documentsSystemTools.findDocument(registry.visibleDocuments, DOCUMENT_URL);

  if (!document) {
    notFound();
  }

  const { default: DocumentContent } = await importDocumentModule(document);
  const navigation = documentsSystemTools.buildPageNavigation(
    registry.visibleDocuments,
    DOCUMENT_URL,
  );
  const mdxComponents = createDocumentsMdxComponents({
    source: document,
    index: registry.linkIndex,
    environment: getDocumentsSystemEnvironment(),
  });

  return (
    <DocumentsSystemPage document={document} navigation={navigation}>
      <DocumentContent components={mdxComponents} />
    </DocumentsSystemPage>
  );
}
