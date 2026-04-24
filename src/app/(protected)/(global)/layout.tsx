import React, { Suspense } from "react";
import { AppSidebar, SidebarProviderWrapper } from "@components/application/app-sidebar";
import { AppSiteHeader } from "@components/application/app-site-header";
import { DocumentHeader } from "@components/application/document/document-header";
import { DocumentProvider } from "@components/application/document/document-provider";
import { SidebarInset } from "@components/ui/sidebar";
import { Skeleton } from "@components/ui/skeleton";

export default async function GlobalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProviderWrapper renderFallbackClosedSidebar>
      <AppSidebar variant="sidebar" />
      <SidebarInset
        className="flex h-screen max-h-screen flex-col overflow-y-scroll"
        style={{ "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
      >
        <DocumentProvider>
          <Suspense fallback={<Skeleton className="h-(--header-height) w-full" />}>
            <AppSiteHeader />
          </Suspense>
          {/* Min height fills the viewport below header; content can grow so only this area scrolls */}
          <div className="flex min-h-[calc(100vh-var(--header-height))] max-w-[2048px] flex-col">
            <div className="@container/main flex flex-1 flex-col gap-4 pb-6 lg:pb-0">
              <Suspense fallback={<div className="h-16" />}>
                <DocumentHeader />
              </Suspense>
              <main
                id="main-content"
                className="flex flex-1 flex-col border-b pb-4 lg:border-b-0 lg:pb-0"
              >
                {children}
              </main>
            </div>
          </div>
        </DocumentProvider>
      </SidebarInset>
    </SidebarProviderWrapper>
  );
}
