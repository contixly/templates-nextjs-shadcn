import { ActionResultError } from "@typings/actions";
import { HttpCodes } from "@typings/network";
import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";
import { NotAuthorized } from "@components/errors/not-authorized";
import { NotFound } from "@components/errors/not-found";
import { NotLogged } from "@components/errors/not-logged";
import { useTranslations } from "next-intl";

export const CommonError = (props: ErrorComponentProps) => {
  const t = useTranslations("common");

  return (
    <ErrorComponent
      title={t("errors.globalError.title")}
      subTitle={t("errors.globalError.subTitle")}
      description={t("errors.globalError.description")}
      {...props}
    />
  );
};

export const renderError = (error?: ActionResultError, props?: ErrorComponentProps) => {
  if (error?.code === HttpCodes.NOT_FOUND) return <NotFound {...props} />;
  if (error?.code === HttpCodes.UNAUTHORIZED) return <NotLogged {...props} />;
  if (error?.code === HttpCodes.FORBIDDEN) return <NotAuthorized {...props} />;
  return <CommonError {...props} />;
};

/**
 * A record of predefined errors with their corresponding metadata.
 *
 * This object maps error identifiers to structured error information,
 * including an indication of failure and optional detailed error data.
 *
 * Each entry in the record represents a specific error case and contains:
 * - `success: false` - A constant indicating the operation resulted in failure.
 * - `error` (optional) - An object containing details about the error, including:
 *   - `message` - A descriptive error message.
 *   - `code` - An HTTP status code representing the error type.
 *
 * Examples of predefined errors in this record:
 * - `unauthorized`: Refers to an error where the user has not logged in.
 * - `forbidden`: Refers to an error where the user lacks proper permissions.
 */
export const errors: Record<
  string,
  {
    success: false;
    error?: ActionResultError;
  }
> = {
  unauthorized: {
    success: false,
    error: {
      message: "401",
      code: HttpCodes.UNAUTHORIZED,
    },
  },
  forbidden: {
    success: false,
    error: {
      message: "403",
      code: HttpCodes.FORBIDDEN,
    },
  },
  notFound: {
    success: false,
    error: {
      message: "404",
      code: HttpCodes.NOT_FOUND,
    },
  },
  internalServerError: {
    success: false,
    error: {
      message: "500",
      code: HttpCodes.SERVER_ERROR,
    },
  },
};
