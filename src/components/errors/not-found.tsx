import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";
import { useTranslations } from "next-intl";

export const NotFound = (props: ErrorComponentProps) => {
  const t = useTranslations("common");

  return (
    <ErrorComponent
      title={t("errors.notFound.title")}
      subTitle={t("errors.notFound.subTitle")}
      description={t("errors.notFound.description")}
      {...props}
    />
  );
};
