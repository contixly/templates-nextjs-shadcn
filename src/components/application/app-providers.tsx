import React, { ReactNode } from "react";
import { TooltipProvider } from "@components/ui/tooltip";
import { Toaster } from "@components/ui/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { APP_LS_PREFIX } from "@lib/environment";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      enableSystem
      disableTransitionOnChange
      storageKey={`${APP_LS_PREFIX}.theme`}
      defaultTheme="system"
    >
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster position="top-center" />
    </NextThemesProvider>
  );
}
