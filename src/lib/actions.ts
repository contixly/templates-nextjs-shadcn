import "server-only";

import {
  ActionResult,
  ProtectedActionHandler,
  ProtectedActionOptions,
  ProtectedActionWithInputHandler,
  ProtectedNamedActionOptions,
} from "@typings/actions";
import { HttpCodes } from "@typings/network";
import { unauthorized } from "next/navigation";
import { z } from "zod";
import { loadCurrentUserId, loadRequestHeaders } from "@features/accounts/accounts-actions";
import { errors } from "@components/errors/common-error";
import { loggerFactory } from "@lib/logger";

const defaultLogger = loggerFactory.child({ module: "common", type: "action" });

export const createProtectedActionWithInput = <TInput, TResult>(
  inputSchema: z.ZodType<TInput>,
  handler: ProtectedActionWithInputHandler<TInput, TResult>,
  options: ProtectedNamedActionOptions
) => createDefaultProtectedActionWithInput(inputSchema, handler, options);

export const createProtectedAction = <TResult>(
  handler: ProtectedActionHandler<TResult>,
  options: ProtectedNamedActionOptions
) => createDefaultProtectedAction(handler, options);

export const createDefaultProtectedAction = <TResult>(
  handler: ProtectedActionHandler<TResult>,
  options?: ProtectedActionOptions
) => {
  const actionName = options?.actionName ?? "defaultProtectedAction";
  const logger = (options?.logger ?? defaultLogger).child({
    function: actionName,
    type: "action",
  });

  return async (): Promise<ActionResult<TResult>> => {
    const headers = await loadRequestHeaders();
    const userId = await loadCurrentUserId();
    if (!userId) {
      unauthorized();
    }

    try {
      return await handler({ headers, userId, logger: logger.child({ userId }) });
    } catch (error) {
      logger.child({ userId }).error({
        error: (error as Error).message,
      });
      return errors.internalServerError;
    }
  };
};

export const createDefaultProtectedActionWithInput = <TInput, TResult>(
  inputSchema: z.ZodType<TInput>,
  handler: ProtectedActionWithInputHandler<TInput, TResult>,
  options?: ProtectedActionOptions
) => {
  const actionName = options?.actionName ?? "defaultProtectedActionWithInput";
  const logger = (options?.logger ?? defaultLogger).child({
    function: actionName,
    type: "action",
  });

  return async (input: TInput): Promise<ActionResult<TResult>> => {
    const validation = inputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          message:
            validation.error.issues[0]?.message ||
            options?.validationErrorMessage ||
            "Invalid input",
          code: HttpCodes.BAD_REQUEST,
        },
      };
    }

    const headers = await loadRequestHeaders();
    const userId = await loadCurrentUserId();
    if (!userId) {
      unauthorized();
    }

    try {
      return await handler(validation.data, { headers, userId, logger: logger.child({ userId }) });
    } catch (error) {
      logger.child({ userId }).error({
        error: (error as Error).message,
      });
      return errors.internalServerError;
    }
  };
};
