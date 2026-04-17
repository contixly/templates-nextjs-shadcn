import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";
import { useTranslations } from "next-intl";

export const NotAuthorized = (props: ErrorComponentProps) => {
  const t = useTranslations("common");

  return (
    <ErrorComponent
      title={t("errors.notAuthorized.title")}
      subTitle={t("errors.notAuthorized.subTitle")}
      description={t("errors.notAuthorized.description")}
      {...props}
    />
  );
};
