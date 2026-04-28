"use client";

import * as React from "react";
import { cn } from "@lib/utils";

type FieldMessageProps = React.ComponentProps<"div"> & {
  description?: React.ReactNode;
  errors?: Array<{ message?: string } | undefined>;
};

const getUniqueErrorMessages = (errors: FieldMessageProps["errors"]) => [
  ...new Set(errors?.map((error) => error?.message).filter(Boolean)),
];

export function FieldMessage({
  className,
  children,
  description,
  errors,
  ...props
}: FieldMessageProps) {
  const errorMessages = getUniqueErrorMessages(errors);
  const hasError = Boolean(children) || errorMessages.length > 0;
  const content =
    children ??
    (errorMessages.length > 1 ? errorMessages.join(" ") : errorMessages[0]) ??
    description;

  return (
    <div
      role={hasError ? "alert" : undefined}
      data-slot="field-message"
      data-state={hasError ? "error" : "description"}
      className={cn(
        "min-h-4 text-left text-xs/4 font-normal",
        hasError ? "text-destructive" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {content ? (
        <span className="inline-flex items-start gap-1">
          <span>{content}</span>
        </span>
      ) : (
        <span aria-hidden="true">&nbsp;</span>
      )}
    </div>
  );
}
