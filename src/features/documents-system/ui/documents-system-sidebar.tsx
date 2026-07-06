"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@components/ui/sidebar";
import { usePathname } from "next/navigation";
import { IconBook2, IconChevronRight, IconEyeOff } from "@tabler/icons-react";
import * as React from "react";
import Link from "next/link";
import { cn } from "@lib/utils";
import type {
  DocumentsSystemParentStatusMix,
  DocumentsSystemSidebarGroup,
  DocumentsSystemStatusTone,
} from "@features/documents-system/documents-system-types";

type SidebarStatusStripe = "draft" | "review" | "archived";

const PARENT_STATUS_MIX_STRIPES: Record<DocumentsSystemParentStatusMix, SidebarStatusStripe[]> = {
  default: [],
  draft: ["draft"],
  review: ["review"],
  "draft-review": ["draft", "review"],
};

const LINK_STATUS_TONE_STRIPES: Record<DocumentsSystemStatusTone, SidebarStatusStripe[]> = {
  default: [],
  draft: ["draft"],
  review: ["review"],
  archived: ["archived"],
};

const STATUS_STRIPE_CLASS: Record<SidebarStatusStripe, string> = {
  draft: "bg-amber-500/80 dark:bg-amber-300/80",
  review: "bg-sky-500/80 dark:bg-sky-300/80",
  archived: "bg-muted-foreground/45 dark:bg-muted-foreground/60",
};

const StatusStripes = ({
  stripes,
  className,
}: {
  stripes: SidebarStatusStripe[];
  className?: string;
}) => {
  if (stripes.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-status-stripes={stripes.join(" ")}
      className={cn("flex h-5 shrink-0 items-stretch gap-0.5", className)}
    >
      {stripes.map((stripe) => (
        <span
          key={stripe}
          data-status-stripe={stripe}
          className={cn("w-1 rounded-full", STATUS_STRIPE_CLASS[stripe])}
        />
      ))}
    </div>
  );
};

export const DocumentsSystemSidebar = ({
  menu,
  ...props
}: React.ComponentProps<typeof Sidebar> & { menu: DocumentsSystemSidebarGroup[] }) => {
  const activePathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                  <IconBook2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Документация</span>
                  <span>v1.0.0</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-2 py-2">
        {menu.map((group) => (
          <SidebarGroup key={group.label} className="px-2 py-1.5">
            <SidebarMenu className="gap-1.5">
              <SidebarGroupLabel className="text-sidebar-foreground/55 h-auto min-h-6 border-b border-dashed px-2 pt-0.5 pb-1.5 text-xs leading-4 font-semibold capitalize">
                {group.label}
              </SidebarGroupLabel>
              {group.items.map((item) => (
                <Collapsible
                  key={item.label}
                  defaultOpen={item.items.some((child) => child.href === activePathname)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {item.items.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          data-status-mix={item.statusMix}
                          className={cn(
                            "text-sidebar-foreground h-auto min-h-9 items-start px-2 py-1.5 text-[0.92rem] leading-5 font-medium",
                            "[&>span]:min-w-0 [&>span]:flex-1 [&>span]:break-words [&>span]:whitespace-normal"
                          )}
                        >
                          <span>{item.label}</span>
                          <StatusStripes
                            stripes={PARENT_STATUS_MIX_STRIPES[item.statusMix]}
                            className="mt-0.5"
                          />
                          <IconChevronRight className="mt-0.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    )}
                    {item.items.length > 0 && (
                      <CollapsibleContent>
                        <SidebarMenuSub className="mx-3 border-l border-dashed px-0 py-1.5">
                          {item.items.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={child.href === activePathname}
                                data-status-tone={child.statusTone}
                                data-hidden-in-production={
                                  child.hiddenInProduction ? "true" : "false"
                                }
                                className={cn(
                                  "text-sidebar-foreground/65 relative ml-1.5 h-auto min-h-8 items-start rounded-none py-1.5 pr-2 pl-4 text-[0.84rem] leading-5 break-words whitespace-normal",
                                  "data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                                )}
                              >
                                <Link href={child.href}>
                                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                    <span className="min-w-0 flex-1 break-words whitespace-normal">
                                      {child.label}
                                    </span>
                                    {child.hiddenInProduction && (
                                      <span
                                        className="inline-flex size-4 shrink-0 items-center justify-center text-rose-600 dark:text-rose-300"
                                        data-hidden-in-production-icon="true"
                                        title="Скрыто в prod"
                                      >
                                        <IconEyeOff aria-hidden="true" className="size-3.5" />
                                      </span>
                                    )}
                                    <StatusStripes
                                      stripes={LINK_STATUS_TONE_STRIPES[child.statusTone]}
                                      className="h-4"
                                    />
                                  </div>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};
