"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@components/ui/button";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { cn } from "@lib/utils";

export const CopyButton = ({
  text,
  ...props
}: { text: string } & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  }, [text]);

  const isIcon = props.size?.includes("icon");

  return (
    <Button onClick={handleCopy} {...props}>
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center transition-all duration-200",
            copied ? "scale-100 opacity-100" : "scale-75 opacity-0"
          )}
          aria-hidden={!copied}
        >
          <IconCheck className="stroke-green-600 dark:stroke-green-400" />
        </span>
        <span
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center transition-all duration-200",
            copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
          )}
          aria-hidden={copied}
        >
          <IconCopy />
        </span>
      </span>
      {!isIcon && (copied ? "Copied!" : "Copy")}
    </Button>
  );
};
