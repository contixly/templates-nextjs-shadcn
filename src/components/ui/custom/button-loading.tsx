import * as React from "react";
import { Spinner } from "../spinner";
import { cn } from "src/lib/utils";

export const ButtonLoading = ({
  loading,
  className,
  ...props
}: React.ComponentProps<typeof Spinner> & {
  loading: boolean
}) => (
  <Spinner
    {...props}
    data-icon="inline-start"
    aria-hidden={!loading}
    className={cn(!loading && "invisible", className)}
  />
);
