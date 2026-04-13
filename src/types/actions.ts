import { Logger } from "pino";

/**
 * Represents the result of an action or operation.
 *
 * @template T The type of the data returned when the action is successful.
 *
 * @property {boolean} success Indicates whether the action was successful.
 * @property {T} [data] The data returned when the action is successful. Optional.
 * @property {Object} [error] The error information when the action fails. Optional.
 * @property {string} error.message A message describing the error. Required if error is present.
 * @property {number} [error.code] An optional numerical error code providing additional context.
 */
export type ActionResult<T> = (
  | {
      success: true;
      data: T;
    }
  | {
      success: true;
      data?: null;
    }
  | {
      success: false;
      data?: null;
    }
) & { error?: ActionResultError };

/**
 * Represents an error result for an action.
 *
 * This type is used to convey error details when an action results in a failure.
 * The `message` property provides a descriptive explanation of the error, and
 * the optional `code` property can be used to specify an error code for categorization
 * or further error handling.
 */
export type ActionResultError = {
  message: string;
  code?: number;
};

/**
 * Represents the context for performing a protected action.
 *
 * The `ProtectedActionContext` type is used to ensure that actions requiring
 * specific user authorization have the necessary context to proceed.
 *
 * Properties:
 * - `userId`: A string that uniquely identifies the user performing the action.
 */
export type ProtectedActionContext = {
  userId: string;
  logger: Logger;
};

/**
 * Represents a handler for executing protected actions with specific input and context.
 *
 * This type defines a function interface that performs an asynchronous operation
 * based on the given input and context, returning a result encapsulated in a promise.
 *
 * @template TInput The type of the input parameter passed to the action handler.
 * @template TResult The type of the result returned after the action is executed.
 * @param input The input data required to execute the action.
 * @param context The context containing details or permissions required to
 *        securely perform the action.
 * @returns A promise resolving to an ActionResult containing the result of the action.
 */
export type ProtectedActionWithInputHandler<TInput, TResult> = (
  input: TInput,
  context: ProtectedActionContext
) => Promise<ActionResult<TResult>>;

/**
 * A type definition for a function that handles a protected action within
 * a specific context and returns a promise resolving to an action result.
 *
 * Designed to be used in scenarios where actions require particular
 * authorization or context validation before they can be executed.
 *
 * @template TResult - The type of the result returned by the action handler.
 * @param {ProtectedActionContext} context - The execution context for the protected action.
 *    This typically includes information such as authentication, permissions, or
 *    necessary data required to perform the action.
 * @returns {Promise<ActionResult<TResult>>} A promise that resolves to the result
 *    of the action or an appropriate failure/validation state.
 */
export type ProtectedActionHandler<TResult> = (
  context: ProtectedActionContext
) => Promise<ActionResult<TResult>>;

/**
 * Represents a set of options for configuring a protected action.
 *
 */
export type ProtectedActionOptions = {
  actionName?: string;
  validationErrorMessage?: string;
  logger?: Logger;
};

/**
 * Represents configuration options for actions with a protected name.
 *
 * This type extends `ProtectedActionOptions`, excluding the `actionName` property,
 * and redefines `actionName` to ensure it is always explicitly provided as a string.
 * It is commonly used to enforce stricter typing for actions requiring
 * a mandatory and specific name.
 *
 */
export type ProtectedNamedActionOptions = Omit<ProtectedActionOptions, "actionName"> & {
  actionName: string;
};
