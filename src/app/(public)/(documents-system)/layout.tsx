import type { CSSProperties, ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { SidebarInset } from "@components/ui/sidebar";
import { getCachedDocuments } from "@features/documents-system/documents-system-actions";
import { DOCUMENTS_SYSTEM_SCROLL_CONTAINER_ATTRIBUTE } from "@features/documents-system/documents-system-consts";
import { getDocumentsSystemEnvironment } from "@features/documents-system/documents-system-runtime";
import { documentsSystemTools } from "@features/documents-system/documents-system-tools";
import { DocumentsSystemHeader } from "@features/documents-system/ui/documents-system-header";
import { DocumentsSystemSidebar } from "@features/documents-system/ui/documents-system-sidebar";
import { DocumentsSystemSidebarProvider } from "@features/documents-system/ui/documents-system-sidebar-provider";
import type { DocumentsSystemSidebarGroup } from "@features/documents-system/documents-system-types";

const documentsSidebarStyle = {
  "--sidebar-width": "24rem",
} as CSSProperties;

type DocumentsSystemShellProps = Readonly<{
  children: ReactNode;
  sidebarMenu: DocumentsSystemSidebarGroup[];
}>;

const DocumentsSystemShell = ({ children, sidebarMenu }: DocumentsSystemShellProps) => (
  <DocumentsSystemSidebarProvider style={documentsSidebarStyle}>
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
  </DocumentsSystemSidebarProvider>
);

export default async function DocumentsSystemLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getLocale();
  const documents = await getCachedDocuments(locale);
  const sidebarMenu = documentsSystemTools.buildSidebarMenuItems(
    documents,
    getDocumentsSystemEnvironment()
  );

  return <DocumentsSystemShell sidebarMenu={sidebarMenu}>{children}</DocumentsSystemShell>;
}
