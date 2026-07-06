"use client";

import * as React from "react";
import { Button } from "@components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";

type ButtonWithTooltipProps = React.ComponentProps<typeof Button> & {
  tooltipContent?: React.ReactNode;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
};

export const ButtonWithTooltip = ({
  tooltipContent,
  tooltipSide,
  ...props
}: ButtonWithTooltipProps) => {
  const button = <Button {...props} />;

  if (!tooltipContent) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
