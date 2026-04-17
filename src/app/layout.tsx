import "./globals.css";
import React, { Suspense, ViewTransition } from "react";
import type { Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import AppProviders from "@components/application/app-providers";
import { YandexMetrikaContainer } from "@components/application/metrics/yandex-metrika-container";
import { YandexMetrikaNoscript } from "@components/application/metrics/yandex-metrika-noscript";
import { GlobalMetadata } from "@lib/metadata";
import { YM_COUNTER_ID } from "@lib/environment";
import { resolveAppLocale } from "@/src/i18n/config";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-sans" });

export { GlobalMetadata as metadata };

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={resolveAppLocale()} suppressHydrationWarning className={jetbrainsMono.variable}>
      <body className="min-h-svh antialiased">
        <a
          href="#main-content"
          className="bg-background text-foreground focus-visible:ring-ring sr-only fixed top-3 left-3 z-50 px-3 py-2 focus-visible:not-sr-only focus-visible:ring-2"
        >
          Skip to main content
        </a>
        <AppProviders>
          <ViewTransition
            default={{
              default: "none",
              fade: "fade",
            }}
          >
            {children}
          </ViewTransition>
        </AppProviders>
        <Suspense>
          <YandexMetrikaContainer enabled />
        </Suspense>
        <YandexMetrikaNoscript id={Number(YM_COUNTER_ID)} />
      </body>
    </html>
  );
}
