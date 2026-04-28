import * as React from "react";
import { Button } from "../button";
import { Spinner } from "../spinner";
import { cn } from "src/lib/utils";

type LoadingButtonProps = Omit<React.ComponentProps<typeof Button>, "asChild"> & {
  loading: boolean;
};

const getContentGapClass = (size: LoadingButtonProps["size"]) => {
  if (size === "xs" || size === "sm") {
    return "gap-1";
  }

  return "gap-1.5";
};

export const LoadingButton = ({
  loading,
  className,
  children,
  size,
  ...props
}: LoadingButtonProps) => (
  <Button
    {...props}
    size={size}
    aria-busy={loading || undefined}
    className={cn("relative", className)}
  >
    <span
      className={cn(
        "inline-flex items-center justify-center transition-opacity",
        getContentGapClass(size),
        loading && "opacity-0"
      )}
    >
      {children}
    </span>
    {loading ? (
      <Spinner className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    ) : null}
  </Button>
);
