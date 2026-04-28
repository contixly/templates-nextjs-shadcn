import { z } from "zod";
import { id } from "@lib/z";
import { AnyTranslationsFn } from "@/src/i18n/config";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { normalizeWorkspaceTeamName } from "@features/workspaces/workspaces-teams-utils";

export const WORKSPACE_TEAM_NAME_MAX_LENGTH = 50;

const workspaceTeamNamePattern = /^[\p{L}0-9\s\-_]+$/u;

const getErrorMessage = (
  tAny: AnyTranslationsFn | undefined,
  key: (typeof WORKSPACE_ERROR_KEYS)[keyof typeof WORKSPACE_ERROR_KEYS],
  options?: object
) => (tAny ? tAny(key, options) : key);

const createWorkspaceTeamNameSchema = (previousName?: string, tAny?: AnyTranslationsFn) =>
  z
    .string()
    .superRefine((value, ctx) => {
      const trimmedValue = normalizeWorkspaceTeamName(value);
      const normalizedValue = trimmedValue.toLowerCase();

      if (trimmedValue.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.teamNameRequired),
        });
      }

      if (trimmedValue.length > WORKSPACE_TEAM_NAME_MAX_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.teamNameTooLong, {
            max: WORKSPACE_TEAM_NAME_MAX_LENGTH,
          }),
        });
      }

      if (trimmedValue.length > 0 && !workspaceTeamNamePattern.test(trimmedValue)) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.teamNameInvalidCharacters),
        });
      }

      if (
        previousName !== undefined &&
        trimmedValue !== previousName &&
        normalizedValue === normalizeWorkspaceTeamName(previousName).toLowerCase()
      ) {
        ctx.addIssue({
          code: "custom",
          message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.teamNameUnchanged),
        });
      }
    })
    .transform(normalizeWorkspaceTeamName);

const teamName = createWorkspaceTeamNameSchema();

export const createWorkspaceTeamSchema = z.object({
  organizationId: organizationIdSchema,
  name: teamName,
});

export const createWorkspaceTeamFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    organizationId: organizationIdSchema,
    name: createWorkspaceTeamNameSchema(undefined, tAny),
  });

export const updateWorkspaceTeamSchema = z.object({
  organizationId: organizationIdSchema,
  teamId: id,
  name: teamName,
});

export const createUpdateWorkspaceTeamFormSchema = (
  previousName: string,
  tAny: AnyTranslationsFn
) =>
  z.object({
    organizationId: organizationIdSchema,
    teamId: id,
    name: createWorkspaceTeamNameSchema(previousName, tAny),
  });

export const deleteWorkspaceTeamSchema = z.object({
  organizationId: organizationIdSchema,
  teamId: id,
});

export const addWorkspaceTeamMemberSchema = z.object({
  organizationId: organizationIdSchema,
  teamId: id,
  userId: id,
});

export const removeWorkspaceTeamMemberSchema = z.object({
  organizationId: organizationIdSchema,
  teamId: id,
  userId: id,
});

export type CreateWorkspaceTeamInput = z.input<typeof createWorkspaceTeamSchema>;
export type UpdateWorkspaceTeamInput = z.input<typeof updateWorkspaceTeamSchema>;
export type DeleteWorkspaceTeamInput = z.input<typeof deleteWorkspaceTeamSchema>;
export type AddWorkspaceTeamMemberInput = z.input<typeof addWorkspaceTeamMemberSchema>;
export type RemoveWorkspaceTeamMemberInput = z.input<typeof removeWorkspaceTeamMemberSchema>;
