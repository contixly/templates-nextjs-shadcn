"use client";

import * as React from "react";
import { CopyButton } from "@components/ui/custom/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";

type CopyButtonWithTooltipProps = Omit<React.ComponentProps<typeof CopyButton>, "text"> & {
  content: string;
  tooltipContent?: React.ReactNode;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
};

export const CopyButtonWithTooltip = ({
  content,
  tooltipContent = "Скопировать",
  tooltipSide,
  copyLabel = "Скопировать",
  copiedLabel = "Скопировано",
  ...props
}: CopyButtonWithTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <CopyButton
          text={content}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
