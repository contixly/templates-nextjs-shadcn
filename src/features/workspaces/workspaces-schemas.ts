import { z } from "zod";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { AnyTranslationsFn } from "@/src/i18n/config";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";
import { normalizeWorkspaceAllowedEmailDomains } from "@features/workspaces/workspaces-domain-restrictions";

export const WORKSPACE_NAME_MAX_LENGTH = 50;
const workspaceNamePattern = /^[\p{L}0-9\s\-_]+$/u;
const workspaceSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
const createWorkspaceSlugSchema = (tAny?: AnyTranslationsFn) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .regex(workspaceSlugPattern, getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.nameInvalidCharacters));

const slug = createWorkspaceSlugSchema();

const splitWorkspaceAllowedEmailDomainsText = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((domain) => domain.trim())
    .filter(Boolean);

const createWorkspaceAllowedEmailDomainsSchema = (tAny?: AnyTranslationsFn) =>
  z
    .array(z.string())
    .optional()
    .superRefine((values, ctx) => {
      const normalization = normalizeWorkspaceAllowedEmailDomains(values ?? []);

      if (normalization.invalidDomains.length === 0) {
        return;
      }

      ctx.addIssue({
        code: "custom",
        message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.allowedEmailDomainInvalid, {
          domain: normalization.invalidDomains[0],
        }),
      });
    })
    .transform((values) =>
      values === undefined ? undefined : normalizeWorkspaceAllowedEmailDomains(values).domains
    );

const createWorkspaceAllowedEmailDomainsFormSchema = (tAny?: AnyTranslationsFn) =>
  z
    .string()
    .optional()
    .superRefine((value, ctx) => {
      const normalization = normalizeWorkspaceAllowedEmailDomains(
        value === undefined ? [] : splitWorkspaceAllowedEmailDomainsText(value)
      );

      if (normalization.invalidDomains.length === 0) {
        return;
      }

      ctx.addIssue({
        code: "custom",
        message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.allowedEmailDomainInvalid, {
          domain: normalization.invalidDomains[0],
        }),
      });
    })
    .transform((value) =>
      value === undefined
        ? undefined
        : normalizeWorkspaceAllowedEmailDomains(splitWorkspaceAllowedEmailDomainsText(value))
            .domains
    );

export const createWorkspaceSchema = z.object({
  name,
});

export const createWorkspaceFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    name: createWorkspaceNameSchema(undefined, tAny),
  });

export const updateWorkspaceSchema = z.object({
  id: organizationIdSchema,
  name: name.optional(),
  slug: slug.optional(),
  allowedEmailDomains: createWorkspaceAllowedEmailDomainsSchema(),
});

export const createUpdateWorkspaceFormSchema = (previousName: string, tAny: AnyTranslationsFn) =>
  z.object({
    id: organizationIdSchema,
    name: createWorkspaceNameSchema(previousName, tAny).optional(),
    slug: createWorkspaceSlugSchema(tAny).optional(),
    allowedEmailDomains: createWorkspaceAllowedEmailDomainsFormSchema(tAny),
  });

const createDeleteWorkspaceSchema = (tAny?: AnyTranslationsFn) =>
  z
    .object({
      id: organizationIdSchema,
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
