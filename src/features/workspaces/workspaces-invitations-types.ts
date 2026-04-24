import routes from "@features/routes";
import { APP_BASE_URL } from "@lib/environment";
import { revalidateTags, updateTags } from "@lib/cache";

export type WorkspaceInvitationStoredStatus = "pending" | "accepted" | "rejected" | "canceled";

export type WorkspaceInvitationDisplayStatus = WorkspaceInvitationStoredStatus | "expired";

export type WorkspaceInvitationDecisionState =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled"
  | "expired"
  | "recipient-mismatch"
  | "email-verification-required"
  | "already-member";

export interface WorkspaceInvitationDto {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug?: string | null;
  email: string;
  role: string;
  roleLabels: string[];
  status: WorkspaceInvitationStoredStatus;
  displayStatus: WorkspaceInvitationDisplayStatus;
  expiresAt: Date;
  createdAt: Date;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  invitationUrl: string;
}

export interface WorkspaceInvitationDecisionContext {
  invitation: WorkspaceInvitationDto;
  state: WorkspaceInvitationDecisionState;
  canRespond: boolean;
}

export const normalizeWorkspaceInvitationEmail = (value: string) => value.trim().toLowerCase();

export const splitWorkspaceInvitationRoleLabels = (role: string) =>
  Array.from(
    new Set(
      role
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

export const deriveWorkspaceInvitationDisplayStatus = (
  status: string,
  expiresAt: Date,
  now: Date = new Date()
): WorkspaceInvitationDisplayStatus => {
  if (status === "pending" && expiresAt <= now) {
    return "expired";
  }

  return status as WorkspaceInvitationDisplayStatus;
};

export const withResolvedWorkspaceInvitationDisplayStatus = <T extends WorkspaceInvitationDto>(
  invitation: T,
  now: Date = new Date()
): T => ({
  ...invitation,
  displayStatus: deriveWorkspaceInvitationDisplayStatus(
    invitation.status,
    invitation.expiresAt,
    now
  ),
});

export const isWorkspaceInvitationActionable = (
  invitation: Pick<WorkspaceInvitationDto, "displayStatus">
) => invitation.displayStatus === "pending";

export const buildWorkspaceInvitationUrl = (invitationId: string) =>
  new URL(
    routes.accounts.pages.invitation.path({
      invitationId,
    }),
    APP_BASE_URL
  ).toString();

export const CACHE_WorkspaceInvitationsTag = (organizationId: string) =>
  `organization_${organizationId}_invitations`;

export const CACHE_WorkspaceInvitationByIdTag = (invitationId: string) =>
  `invitation_${invitationId}`;

export const CACHE_PendingWorkspaceInvitationsByEmailTag = (email: string) =>
  `invitation_email_${normalizeWorkspaceInvitationEmail(email)}`;

const getWorkspaceInvitationCacheTags = ({
  invitationId,
  organizationId,
  email,
}: {
  invitationId?: string | null;
  organizationId?: string | null;
  email?: string | null;
}) =>
  Array.from(
    new Set([
      ...(organizationId ? [CACHE_WorkspaceInvitationsTag(organizationId)] : []),
      ...(invitationId ? [CACHE_WorkspaceInvitationByIdTag(invitationId)] : []),
      ...(email ? [CACHE_PendingWorkspaceInvitationsByEmailTag(email)] : []),
    ])
  );

export const updateWorkspaceInvitationCache = (options: {
  invitationId?: string | null;
  organizationId?: string | null;
  email?: string | null;
}) => updateTags(getWorkspaceInvitationCacheTags(options));

export const revalidateWorkspaceInvitationCache = (options: {
  invitationId?: string | null;
  organizationId?: string | null;
  email?: string | null;
}) => revalidateTags(getWorkspaceInvitationCacheTags(options));
