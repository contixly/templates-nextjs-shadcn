import React, { ReactNode } from "react";
import { TooltipProvider } from "@components/ui/tooltip";
import { Toaster } from "@components/ui/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { APP_LS_PREFIX } from "@lib/environment";
import { NextIntlClientProvider } from "next-intl";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      enableSystem
      disableTransitionOnChange
      storageKey={`${APP_LS_PREFIX}.theme`}
      defaultTheme="system"
    >
      <NextIntlClientProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </NextIntlClientProvider>
      <Toaster position="top-center" />
    </NextThemesProvider>
  );
}
