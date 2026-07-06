import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import React from "react";
import Link from "next/link";
import { ButtonGroup } from "@components/ui/button-group";
import { ButtonWithTooltip } from "@components/ui/custom/button-with-tooltip";
import type { DocumentsSystemPageNavigation } from "@features/documents-system/documents-system-types";

export const DocumentsSystemPageActionsTop = ({
  navigation,
}: {
  navigation: DocumentsSystemPageNavigation;
}) => {
  const { prev, next } = navigation;

  if (!prev && !next) {
    return null;
  }

  return (
    <div className="border-border/50 bg-background/80 fixed inset-x-0 bottom-0 isolate z-50 flex items-center gap-2 border-t px-6 py-4 backdrop-blur-sm sm:static sm:z-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-1.5 sm:backdrop-blur-none">
      <ButtonGroup className="items-center">
        {prev ? (
          <ButtonWithTooltip asChild variant="outline" tooltipContent={prev.title}>
            <Link href={prev.href} aria-label="Previous document">
              <IconArrowLeft />
            </Link>
          </ButtonWithTooltip>
        ) : (
          <ButtonWithTooltip
            variant="outline"
            disabled
            aria-label="Previous document"
            tooltipContent={undefined}
          >
            <IconArrowLeft />
          </ButtonWithTooltip>
        )}
        {next ? (
          <ButtonWithTooltip asChild variant="outline" tooltipContent={next.title}>
            <Link href={next.href} aria-label="Next document">
              <IconArrowRight />
            </Link>
          </ButtonWithTooltip>
        ) : (
          <ButtonWithTooltip
            variant="outline"
            disabled
            aria-label="Next document"
            tooltipContent={undefined}
          >
            <IconArrowRight />
          </ButtonWithTooltip>
        )}
      </ButtonGroup>
    </div>
  );
};
