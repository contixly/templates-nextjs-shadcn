import { IconMenu3 } from "@tabler/icons-react";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@lib/utils";
import { DocumentsSystemPageMenuItem } from "./documents-system-page-scroll-spy";

export const DocumentsSystemPageMenu = ({
  menuItems,
  activeHref,
}: {
  menuItems: DocumentsSystemPageMenuItem[];
  activeHref?: string;
}) => {
  const t = useTranslations("documentsSystem.ui.page");

  return (
    <div className="text-muted-foreground sticky top-9 flex max-h-[calc(100vh-4rem)] w-full flex-col self-start overflow-y-auto text-sm">
      <p className="mb-3 flex h-6 items-center gap-1 text-xs">
        <IconMenu3 size={16} />
        {t("tocTitle")}
      </p>
      <div
        className={cn("flex flex-col gap-1", {
          "border-muted-foreground/60 border-l border-dashed": menuItems.length > 0,
        })}
      >
        {menuItems.map((item) => {
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={`#${item.href}`}
              className={cn(
                "hover:text-foreground block py-2 pl-3 text-sm no-underline transition-colors",
                isActive
                  ? "border-foreground text-foreground -ml-0.5 border-l-2 font-bold"
                  : "text-muted-foreground"
              )}
              data-active={isActive}
              data-depth="2"
              aria-current={isActive ? "location" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
