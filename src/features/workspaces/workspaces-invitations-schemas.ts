import { z } from "zod";
import { id } from "@lib/z";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { AnyTranslationsFn } from "@/src/i18n/config";

const getErrorMessage = (
  tAny: AnyTranslationsFn | undefined,
  key: (typeof WORKSPACE_ERROR_KEYS)[keyof typeof WORKSPACE_ERROR_KEYS]
) => (tAny ? tAny(key) : key);

const createInvitationEmailSchema = (tAny?: AnyTranslationsFn) =>
  z
    .string()
    .trim()
    .min(1, getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.invitationEmailRequired))
    .email(getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.invitationEmailInvalid))
    .transform((value) => value.toLowerCase());

const createMemberUserIdSchema = (tAny?: AnyTranslationsFn) =>
  z.string().trim().min(1, getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.memberIdRequired)).pipe(id);

export const createWorkspaceInvitationSchema = z.object({
  organizationId: organizationIdSchema,
  email: createInvitationEmailSchema(),
});

export const createWorkspaceInvitationFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    organizationId: organizationIdSchema,
    email: createInvitationEmailSchema(tAny),
  });

export const addWorkspaceMemberSchema = z.object({
  organizationId: organizationIdSchema,
  userId: createMemberUserIdSchema(),
});

export const addWorkspaceMemberFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    organizationId: organizationIdSchema,
    userId: createMemberUserIdSchema(tAny),
  });

export const updateWorkspaceInvitationDecisionSchema = z.object({
  invitationId: id,
});

export type CreateWorkspaceInvitationInput = z.input<typeof createWorkspaceInvitationSchema>;
export type AddWorkspaceMemberInput = z.input<typeof addWorkspaceMemberSchema>;
export type UpdateWorkspaceInvitationDecisionInput = z.input<
  typeof updateWorkspaceInvitationDecisionSchema
>;
