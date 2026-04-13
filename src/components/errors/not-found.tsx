import common from "@messages/common.json";
import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";

export const NotFound = (props: ErrorComponentProps) => (
  <ErrorComponent
    title={common.errors.notFound.title}
    subTitle={common.errors.notFound.subTitle}
    description={common.errors.notFound.description}
    {...props}
  />
);
