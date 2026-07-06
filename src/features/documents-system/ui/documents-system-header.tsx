import { IconHome } from "@tabler/icons-react";
import React from "react";
import Link from "next/link";
import { ThemeSwitcher } from "@components/application/theme/theme-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@components/ui/breadcrumb";
import { buttonVariants } from "@components/ui/button";
import { SidebarTrigger } from "@components/ui/sidebar";
import { DocumentsSystemBreadcrumb } from "@features/documents-system/ui/documents-system-breadcrumb";
import { DocumentsSystemSearch } from "@features/documents-system/ui/documents-system-search";
import routes from "@features/routes";

export const DocumentsSystemHeader = () => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.documents_system.pages.home.path()}>Документация</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <DocumentsSystemBreadcrumb />
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="shrink-0 px-3">
        <div className="flex items-center gap-2 text-sm">
          <DocumentsSystemSearch />
          <a
            href={routes.application.pages.home.path()}
            aria-label="На главную"
            title="На главную"
            data-slot="button"
            data-variant="outline"
            data-size="icon"
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <IconHome />
          </a>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};
