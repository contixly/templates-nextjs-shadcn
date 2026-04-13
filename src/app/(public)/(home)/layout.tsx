import { DocumentProvider } from "@components/application/document/document-provider";
import React from "react";
import { AppSiteHeader } from "@components/application/app-site-header";

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <DocumentProvider>
        <AppSiteHeader
          hideSidebarTrigger
          style={
            {
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        />
        <main id="main-content" className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 md:gap-6">{children}</div>
          </div>
        </main>
      </DocumentProvider>
    </div>
  );
}
