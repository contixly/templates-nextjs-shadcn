import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import React from "react";
import Link from "next/link";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@components/ui/item";
import { cn } from "@lib/utils";
import type { DocumentsSystemPageNavigation } from "@features/documents-system/documents-system-types";

export const DocumentsSystemPageActionsBottom = ({
  navigation,
}: {
  navigation: DocumentsSystemPageNavigation;
}) => {
  const { prev, next } = navigation;

  if (!prev && !next) {
    return null;
  }

  return (
    <div className="mt-14 grid grid-cols-1 gap-4 pb-6 lg:grid-cols-2">
      {[prev, next].map((item, index) => (
        <div key={`${index}_${item?.href}`}>
          {item && (
            <Item asChild variant="outline" className="h-full">
              <Link href={item.href}>
                {index === 0 && (
                  <ItemActions>
                    <IconArrowLeft className="size-4" />
                  </ItemActions>
                )}
                <ItemContent className={cn({ "text-right": index === 1 })}>
                  <ItemTitle className={cn({ "self-end": index === 1 })}>{item.title}</ItemTitle>
                  <ItemDescription>{item.description}</ItemDescription>
                </ItemContent>
                {index === 1 && (
                  <ItemActions>
                    <IconArrowRight className="size-4" />
                  </ItemActions>
                )}
              </Link>
            </Item>
          )}
        </div>
      ))}
    </div>
  );
};
