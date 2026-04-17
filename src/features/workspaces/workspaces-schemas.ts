import { z } from "zod";
import { id } from "@lib/z";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { AnyTranslationsFn } from "@/src/i18n/config";

export const WORKSPACE_NAME_MAX_LENGTH = 50;
const workspaceNamePattern = /^[\p{L}0-9\s\-_]+$/u;

const getErrorMessage = (
  tAny: AnyTranslationsFn | undefined,
  key: (typeof WORKSPACE_ERROR_KEYS)[keyof typeof WORKSPACE_ERROR_KEYS],
  options?: object
) => (tAny ? tAny(key, options) : key);

const createWorkspaceNameSchema = (previousName?: string, tAny?: AnyTranslationsFn) =>
  z
    .string()
    .superRefine((value, ctx) => {
      const trimmedValue = value.trim().toLowerCase();

      if (trimmedValue.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.nameRequired),
        });
      }

      if (trimmedValue.length > WORKSPACE_NAME_MAX_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.nameTooLong, {
            max: WORKSPACE_NAME_MAX_LENGTH,
          }),
        });
      }

      if (!workspaceNamePattern.test(trimmedValue)) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.nameInvalidCharacters),
        });
      }

      if (
        previousName !== undefined &&
        value !== previousName &&
        trimmedValue === previousName.trim().toLowerCase()
      ) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.nameUnchanged),
        });
      }
    })
    .transform((value) => value.trim());

const name = createWorkspaceNameSchema();

export const createWorkspaceSchema = z.object({
  name,
  isDefault: z.boolean().default(false),
});

export const createWorkspaceFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    name: createWorkspaceNameSchema(undefined, tAny),
    isDefault: z.boolean().default(false),
  });

export const updateWorkspaceSchema = z.object({
  id,
  name: name.optional(),
  isDefault: z.boolean().optional(),
});

export const createUpdateWorkspaceFormSchema = (previousName: string, tAny: AnyTranslationsFn) =>
  z.object({
    id,
    name: createWorkspaceNameSchema(previousName, tAny).optional(),
    isDefault: z.boolean().optional(),
  });

const createDeleteWorkspaceSchema = (tAny?: AnyTranslationsFn) =>
  z
    .object({
      id,
      name: z.string(),
      confirmationText: z
        .string()
        .trim()
        .min(1, getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.confirmationRequired)),
    })
    .refine((data) => data.confirmationText === data.name, {
      message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.confirmationMismatch),
      path: ["confirmationText"],
    });

export const deleteWorkspaceSchema = createDeleteWorkspaceSchema();

export const createDeleteWorkspaceFormSchema = (tAny: AnyTranslationsFn) =>
  createDeleteWorkspaceSchema(tAny);

export type CreateWorkspaceInput = z.input<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.input<typeof updateWorkspaceSchema>;
export type DeleteWorkspaceInput = z.input<typeof deleteWorkspaceSchema>;
