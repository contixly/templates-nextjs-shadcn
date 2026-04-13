import common from "@messages/common.json";
import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";

export const NotAuthorized = (props: ErrorComponentProps) => (
  <ErrorComponent
    title={common.errors.notAuthorized.title}
    subTitle={common.errors.notAuthorized.subTitle}
    description={common.errors.notAuthorized.description}
    {...props}
  />
);
