import { z } from "zod";
import { id } from "@lib/z";
import { organizationIdSchema } from "@features/organizations/organizations-schemas";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import {
  WORKSPACE_MANAGEABLE_ROLES,
  type WorkspaceManageableRole,
} from "@features/workspaces/workspaces-roles";
import {
  extractWorkspaceEmailDomain,
  normalizeWorkspaceAllowedEmailDomains,
} from "@features/workspaces/workspaces-domain-restrictions";
import { AnyTranslationsFn } from "@/src/i18n/config";

const getErrorMessage = (
  tAny: AnyTranslationsFn | undefined,
  key: (typeof WORKSPACE_ERROR_KEYS)[keyof typeof WORKSPACE_ERROR_KEYS]
) => (tAny ? tAny(key) : key);

const createInvitationEmailSchema = (
  tAny?: AnyTranslationsFn,
  allowedEmailDomains: readonly string[] = []
) => {
  const normalizedAllowedEmailDomains =
    normalizeWorkspaceAllowedEmailDomains(allowedEmailDomains).domains;

  return z
    .string()
    .trim()
    .min(1, getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.invitationEmailRequired))
    .email(getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.invitationEmailInvalid))
    .superRefine((value, ctx) => {
      if (normalizedAllowedEmailDomains.length === 0) {
        return;
      }

      const emailDomain = extractWorkspaceEmailDomain(value);

      if (!emailDomain || normalizedAllowedEmailDomains.includes(emailDomain)) {
        return;
      }

      ctx.addIssue({
        code: "custom",
        message: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.invitationDomainRestricted),
      });
    })
    .transform((value) => value.toLowerCase());
};

const createMemberUserIdSchema = (tAny?: AnyTranslationsFn) =>
  z.string().trim().min(1, getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.memberIdRequired)).pipe(id);

const createWorkspaceRoleSchema = (tAny?: AnyTranslationsFn) =>
  z.enum(WORKSPACE_MANAGEABLE_ROLES, {
    error: getErrorMessage(tAny, WORKSPACE_ERROR_KEYS.workspaceRoleInvalid),
  });

export const createWorkspaceInvitationSchema = z.object({
  organizationId: organizationIdSchema,
  email: createInvitationEmailSchema(),
  role: createWorkspaceRoleSchema(),
  teamId: id.nullable().optional(),
});

export const createWorkspaceInvitationFormSchema = (
  tAny: AnyTranslationsFn,
  allowedEmailDomains: readonly string[] = []
) =>
  z.object({
    organizationId: organizationIdSchema,
    email: createInvitationEmailSchema(tAny, allowedEmailDomains),
    role: createWorkspaceRoleSchema(tAny),
    teamId: id.nullable().optional(),
  });

export const addWorkspaceMemberSchema = z.object({
  organizationId: organizationIdSchema,
  userId: createMemberUserIdSchema(),
  role: createWorkspaceRoleSchema(),
  acknowledgeDomainRestriction: z.boolean().optional(),
});

export const addWorkspaceMemberFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    organizationId: organizationIdSchema,
    userId: createMemberUserIdSchema(tAny),
    role: createWorkspaceRoleSchema(tAny),
    acknowledgeDomainRestriction: z.boolean().optional(),
  });

export const updateWorkspaceMemberRoleSchema = z.object({
  organizationId: organizationIdSchema,
  memberId: id,
  role: createWorkspaceRoleSchema(),
});

export const updateWorkspaceMemberRoleFormSchema = (tAny: AnyTranslationsFn) =>
  z.object({
    organizationId: organizationIdSchema,
    memberId: id,
    role: createWorkspaceRoleSchema(tAny),
  });

export const updateWorkspaceInvitationDecisionSchema = z.object({
  invitationId: id,
});

export type CreateWorkspaceInvitationInput = z.input<typeof createWorkspaceInvitationSchema>;
export type AddWorkspaceMemberInput = z.input<typeof addWorkspaceMemberSchema>;
export type UpdateWorkspaceMemberRoleInput = z.input<typeof updateWorkspaceMemberRoleSchema>;
export type WorkspaceRoleInput = WorkspaceManageableRole;
export type UpdateWorkspaceInvitationDecisionInput = z.input<
  typeof updateWorkspaceInvitationDecisionSchema
>;
