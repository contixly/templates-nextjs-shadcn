import React, { ReactNode, Suspense, use } from "react";
import { getLocale } from "next-intl/server";
import { SidebarInset, SidebarProvider } from "@components/ui/sidebar";
import { getTFromCookie } from "@lib/cookies";
import { SIDEBAR_COOKIE_KEY } from "@lib/environment";
import { getCachedDocuments } from "@features/documents-system/documents-system-actions";
import { DOCUMENTS_SYSTEM_SCROLL_CONTAINER_ATTRIBUTE } from "@features/documents-system/documents-system-consts";
import { getDocumentsSystemEnvironment } from "@features/documents-system/documents-system-runtime";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import { DocumentsSystemHeader } from "@features/documents-system/ui/documents-system-header";
import { DocumentsSystemSidebar } from "@features/documents-system/ui/documents-system-sidebar";
import type { DocumentsSystemSidebarGroup } from "@features/documents-system/documents-system-types";

const documentsSidebarStyle = {
  "--sidebar-width": "24rem",
} as React.CSSProperties;

type DocumentsSystemShellProps = Readonly<{
  children: ReactNode;
  defaultOpen: boolean;
  sidebarMenu: DocumentsSystemSidebarGroup[];
}>;

const DocumentsSystemShell = ({
  children,
  defaultOpen,
  sidebarMenu,
}: DocumentsSystemShellProps) => (
  <SidebarProvider defaultOpen={defaultOpen} style={documentsSidebarStyle}>
    <DocumentsSystemSidebar menu={sidebarMenu} />
    <SidebarInset
      className="flex h-screen flex-col overflow-y-auto"
      {...{ [DOCUMENTS_SYSTEM_SCROLL_CONTAINER_ATTRIBUTE]: "" }}
    >
      <DocumentsSystemHeader />
      <div id="main-content" className="min-w-0" tabIndex={-1}>
        {children}
      </div>
    </SidebarInset>
  </SidebarProvider>
);

const DocumentsSystemSidebarProviderLoader = ({
  sideBarStatePromise,
  ...props
}: Omit<DocumentsSystemShellProps, "defaultOpen"> & {
  sideBarStatePromise: Promise<boolean | undefined>;
}) => {
  const sideBarState = use(sideBarStatePromise) ?? false;

  return <DocumentsSystemShell defaultOpen={sideBarState} {...props} />;
};

export default async function DocumentsSystemLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const sideBarStatePromise = getTFromCookie<boolean>(SIDEBAR_COOKIE_KEY);
  const locale = await getLocale();
  const documents = await getCachedDocuments(locale);
  const sidebarMenu = documentsSystemTools.buildSidebarMenuItems(
    documents,
    getDocumentsSystemEnvironment()
  );

  return (
    <Suspense
      fallback={
        <DocumentsSystemShell defaultOpen={false} sidebarMenu={sidebarMenu}>
          {children}
        </DocumentsSystemShell>
      }
    >
      <DocumentsSystemSidebarProviderLoader
        sideBarStatePromise={sideBarStatePromise}
        sidebarMenu={sidebarMenu}
      >
        {children}
      </DocumentsSystemSidebarProviderLoader>
    </Suspense>
  );
}
