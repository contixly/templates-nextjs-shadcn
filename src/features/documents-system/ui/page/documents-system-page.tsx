import React, { PropsWithChildren } from "react";
import type {
  DocumentInfo,
  DocumentsSystemPageNavigation,
} from "@features/documents-system/documents-system-types";
import {
  DOCUMENTS_SYSTEM_BREADCRUMB_MARKER_ID,
  DOCUMENTS_SYSTEM_CONTENT_ID,
} from "@features/documents-system/documents-system-consts";
import { getDocumentsSystemEnvironment } from "@features/documents-system/documents-system-runtime";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import { DocumentsSystemPageActionsBottom } from "./documents-system-page-actions-bottom";
import { DocumentsSystemPageActionsTop } from "./documents-system-page-actions-top";
import { DocumentsSystemPageMeta } from "./documents-system-page-meta";
import { DocumentsSystemPageToc } from "./documents-system-page-toc";

export const DocumentsSystemPage = ({
  children,
  document,
  navigation,
}: PropsWithChildren & {
  document: DocumentInfo;
  navigation: DocumentsSystemPageNavigation;
}) => {
  const { meta } = document;
  const { title, description, toc } = meta;
  const showToc = toc !== false;
  const documentsSystemEnvironment = getDocumentsSystemEnvironment();
  const statusTone = documentsSystemTools.getDocumentStatusTone(meta, documentsSystemEnvironment);
  const hiddenInProduction = documentsSystemTools.isDocumentHiddenInProduction(
    meta,
    documentsSystemEnvironment
  );

  return (
    <div
      className={
        "mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-10 px-4 pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-10 lg:py-10 " +
        "xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-12 xl:px-12"
      }
    >
      <article className="text-foreground flex w-full min-w-0 flex-col">
        <div
          id={DOCUMENTS_SYSTEM_BREADCRUMB_MARKER_ID}
          hidden
          data-group={meta.group}
          data-parent-item={meta.parentItem}
          data-title={meta.title}
        />
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="scroll-m-20 text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
              {title}
            </h1>
            <DocumentsSystemPageActionsTop navigation={navigation} />
          </div>
          <p className="text-muted-foreground w-full text-base leading-relaxed text-pretty">
            {description}
          </p>
          <DocumentsSystemPageMeta
            meta={meta}
            statusTone={statusTone}
            hiddenInProduction={hiddenInProduction}
          />
        </header>

        <div id={DOCUMENTS_SYSTEM_CONTENT_ID} className="mt-8 flex w-full min-w-0 flex-col">
          {children}
        </div>

        <DocumentsSystemPageActionsBottom navigation={navigation} />
      </article>

      <DocumentsSystemPageToc contentContainerId={DOCUMENTS_SYSTEM_CONTENT_ID} enabled={showToc} />
    </div>
  );
};
