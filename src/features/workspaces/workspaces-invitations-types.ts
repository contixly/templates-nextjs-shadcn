import routes from "@features/routes";
import { APP_BASE_URL } from "@lib/environment";
export {
  CACHE_PendingWorkspaceInvitationsByEmailTag,
  CACHE_WorkspaceInvitationByIdTag,
  CACHE_WorkspaceInvitationsByTeamIdTag,
  CACHE_WorkspaceInvitationsTag,
  normalizeWorkspaceInvitationEmail,
  revalidateWorkspaceInvitationCache,
  updateWorkspaceInvitationCache,
} from "@features/workspaces/workspaces-invitations-cache";

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
  | "domain-restricted"
  | "already-member";

export interface WorkspaceInvitationDto {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug?: string | null;
  teamId?: string | null;
  teamName?: string | null;
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

export type WorkspaceInvitationDecisionContext =
  | {
      invitation: WorkspaceInvitationDto;
      state: "pending";
      canRespond: true;
    }
  | {
      invitation: WorkspaceInvitationDto;
      state: Exclude<WorkspaceInvitationDecisionState, "pending" | "recipient-mismatch">;
      canRespond: false;
    }
  | {
      invitation: null;
      state: "recipient-mismatch";
      canRespond: false;
    };

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
