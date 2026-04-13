import { ActionResultError } from "@typings/actions";
import { HttpCodes } from "@typings/network";
import common from "@messages/common.json";
import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";
import { NotAuthorized } from "@components/errors/not-authorized";
import { NotFound } from "@components/errors/not-found";
import { NotLogged } from "@components/errors/not-logged";

export const CommonError = (props: ErrorComponentProps) => (
  <ErrorComponent
    title={common.errors.globalError.title}
    subTitle={common.errors.globalError.subTitle}
    description={common.errors.globalError.description}
    {...props}
  />
);

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
      message: common.errors.notLogged.title,
      code: HttpCodes.UNAUTHORIZED,
    },
  },
  forbidden: {
    success: false,
    error: {
      message: common.errors.notAuthorized.title,
      code: HttpCodes.FORBIDDEN,
    },
  },
  notFound: {
    success: false,
    error: {
      message: common.errors.notFound.title,
      code: HttpCodes.NOT_FOUND,
    },
  },
  internalServerError: {
    success: false,
    error: {
      message: common.errors.globalError.title,
      code: HttpCodes.SERVER_ERROR,
    },
  },
};
