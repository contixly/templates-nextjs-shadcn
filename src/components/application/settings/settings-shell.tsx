import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@lib/utils";

export type SettingsPageSectionMode = "wide" | "readable";

export const SettingsContentRail = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div
    data-slot="settings-content-rail"
    className={cn("min-w-0 flex-1 px-2 md:mt-4 md:px-4 xl:px-6", className)}
  >
    <div data-slot="settings-page-rail" className="mx-auto w-full max-w-6xl space-y-6">
      {children}
    </div>
  </div>
);

export const SettingsPageShell = ({
  nav,
  children,
  className,
}: PropsWithChildren<{ nav: ReactNode; className?: string }>) => (
  <div className={cn("flex flex-1 md:gap-8", className)}>
    {nav}
    <SettingsContentRail>{children}</SettingsContentRail>
  </div>
);

export const SettingsPageSection = ({
  mode = "wide",
  children,
  className,
}: PropsWithChildren<{ mode?: SettingsPageSectionMode; className?: string }>) => (
  <section
    data-slot="settings-page-section"
    data-mode={mode}
    className={cn("w-full", mode === "readable" && "max-w-3xl", className)}
  >
    {children}
  </section>
);
