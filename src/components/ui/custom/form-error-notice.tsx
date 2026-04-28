import * as React from "react";
import { IconCircleX } from "@tabler/icons-react";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { cn } from "@lib/utils";

type FormErrorNoticeProps = React.ComponentProps<typeof Alert> & {
  title: string;
};

export function FormErrorNotice({
  title,
  children,
  className,
  ...props
}: FormErrorNoticeProps) {
  return (
    <Alert
      variant="destructive"
      data-slot="form-error-notice"
      className={cn("border-destructive/40 bg-destructive/5 py-2", className)}
      {...props}
    >
      <IconCircleX aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </Alert>
  );
}
