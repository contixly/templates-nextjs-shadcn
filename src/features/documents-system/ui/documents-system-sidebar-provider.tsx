"use client";

import * as React from "react";
import { SidebarProvider } from "@components/ui/sidebar";
import { SIDEBAR_COOKIE_KEY } from "@lib/environment";

export const parseDocumentsSidebarCookie = (cookieHeader: string): boolean => {
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SIDEBAR_COOKIE_KEY}=`))
    ?.slice(SIDEBAR_COOKIE_KEY.length + 1);

  if (value === undefined) return false;

  try {
    return JSON.parse(decodeURIComponent(value)) === true;
  } catch {
    return false;
  }
};

export function DocumentsSystemSidebarProvider(
  props: React.ComponentProps<typeof SidebarProvider>
): React.ReactElement {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(parseDocumentsSidebarCookie(document.cookie));
  }, []);

  return <SidebarProvider {...props} open={open} onOpenChange={setOpen} />;
}
