"use client";

import React, { Dispatch, PropsWithChildren, SetStateAction, useEffect } from "react";
import { cn } from "@lib/utils";
import { PropsWithClassName } from "@typings/ui";
import { IconMenu2, IconSearch } from "@tabler/icons-react";
import { Input } from "@components/ui/input";
import { ScrollArea } from "@components/ui/scroll-area";
import { Skeleton } from "@components/ui/skeleton";
import { useIsMobile } from "@hooks/use-mobile";
import { useDocument } from "@components/application/document/document-provider";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@components/ui/drawer";
import { Button } from "@components/ui/button";

interface DocumentSidebarProps extends PropsWithClassName, PropsWithChildren {
  headerName?: string;
  headerAction?: React.ReactNode;
  searchQueryState?: [string, Dispatch<SetStateAction<string>>];
  searchQueryPlaceholder?: string;
  searchAriaLabel?: string;
}

const DocumentSidebar = ({ children, ...props }: DocumentSidebarProps) => {
  const isMobile = useIsMobile();
  const { setDocumentActions, resetDocumentActions } = useDocument().handlers;

  const { headerName, className, headerAction } = props;

  useEffect(() => {
    if (isMobile && headerName && children) {
      setDocumentActions(
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button size="icon" variant="outline" aria-label={`Open ${headerName}`}>
              <IconMenu2 aria-hidden="true" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="flex flex-row items-center justify-center gap-4">
              <DrawerTitle>{headerName}</DrawerTitle>
              {headerAction && headerAction}
            </DrawerHeader>
            <div className="px-4 pb-4">
              <DocumentSidebarComponent {...props} headerAction={undefined} headerName={undefined}>
                {children}
              </DocumentSidebarComponent>
            </div>
          </DrawerContent>
        </Drawer>
      );
      return () => resetDocumentActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerName, isMobile, headerAction, setDocumentActions, children]);

  return (
    !isMobile && (
      <DocumentSidebarComponent {...props} className={cn(className, "hidden md:block")}>
        {children}
      </DocumentSidebarComponent>
    )
  );
};
export default DocumentSidebar;

const DocumentSidebarComponent = ({
  className,
  headerName,
  headerAction,
  children,
  searchQueryState,
  searchQueryPlaceholder,
  searchAriaLabel,
}: DocumentSidebarProps) => {
  const [searchQuery, setSearchQuery] = searchQueryState || [""];

  return (
    <div className={cn("bg-background flex h-full flex-col md:border-r", className)}>
      {/* Header */}
      {headerName && (
        <div className="flex min-h-12 items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">{headerName}</h2>
          {headerAction && headerAction}
        </div>
      )}

      {/* Search */}
      {setSearchQuery && (
        <div className="border-b px-3 py-2">
          {/*// TODO input group*/}
          <div className="relative">
            <IconSearch
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2"
            />
            <Input
              aria-label={searchAriaLabel ?? "Search documents"}
              placeholder={searchQueryPlaceholder ?? "Search…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">{children}</div>
      </ScrollArea>
    </div>
  );
};

export const DocumentSidebarSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("bg-background flex h-full flex-col border-r", className)}>
    <div className="flex items-center justify-between border-b px-3 py-2">
      <Skeleton className="h-5 w-12" />
      <Skeleton className="size-7" />
    </div>
    <div className="border-b px-3 py-2">
      <Skeleton className="h-8 w-full" />
    </div>
    <div className="space-y-1 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  </div>
);
