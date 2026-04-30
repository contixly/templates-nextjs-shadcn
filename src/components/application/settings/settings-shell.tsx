import type { PropsWithChildren, ReactNode } from "react";
import { useId } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { cn } from "@lib/utils";

export type SettingsPageSectionMode = "wide" | "readable";
export type SettingsSectionVariant = "default" | "destructive";

export const SettingsContentRail = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div
    data-slot="settings-content-rail"
    className={cn("min-w-0 flex-1 px-2 md:mt-4 md:px-4 xl:px-6", className)}
  >
    <div data-slot="settings-page-rail" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {children}
    </div>
  </div>
);

export const SettingsPageShell = ({
  nav,
  children,
  className,
}: PropsWithChildren<{ nav: ReactNode; className?: string }>) => (
  <div className={cn("flex flex-1 gap-0 xl:gap-8", className)}>
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
    className={cn("grid w-full gap-4", mode === "readable" && "max-w-3xl", className)}
  >
    {children}
  </section>
);

export const SettingsPageIntro = ({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <header
    data-slot="settings-page-intro"
    className={cn(
      "hidden flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between md:flex",
      className
    )}
  >
    <div className="flex min-w-0 flex-col gap-1.5">
      <h1 className="text-foreground text-2xl font-semibold tracking-normal">{title}</h1>
      {description ? (
        <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>
);

export const SettingsSection = ({
  title,
  description,
  action,
  footer,
  variant = "default",
  children,
  className,
  contentClassName,
}: PropsWithChildren<{
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  variant?: SettingsSectionVariant;
  className?: string;
  contentClassName?: string;
}>) => {
  const titleId = useId();
  const isDestructive = variant === "destructive";

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      data-slot="settings-section"
      data-variant={variant}
      className={cn("gap-0 py-0", isDestructive && "ring-destructive/40", className)}
    >
      <CardHeader className="border-b px-5 py-4 sm:px-6">
        <CardTitle>
          <h2
            id={titleId}
            className={cn("text-sm font-medium", isDestructive && "text-destructive")}
          >
            {title}
          </h2>
        </CardTitle>
        {description ? (
          <CardDescription className={cn(isDestructive && "text-destructive/80")}>
            {description}
          </CardDescription>
        ) : null}
        {action ? (
          <CardAction>
            <div data-slot="settings-section-action" className="flex items-center gap-2">
              {action}
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className={cn("px-5 py-5 sm:px-6", contentClassName)}>
        <div data-slot="settings-section-content" className="min-w-0">
          {children}
        </div>
      </CardContent>
      {footer ? (
        <CardFooter className="px-5 py-4 sm:px-6">
          <div data-slot="settings-section-footer" className="min-w-0">
            {footer}
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
};
