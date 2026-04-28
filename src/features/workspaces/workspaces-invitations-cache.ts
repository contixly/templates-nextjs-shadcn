import { revalidateTags, updateTags } from "@lib/cache";

export const normalizeWorkspaceInvitationEmail = (value: string) => value.trim().toLowerCase();

export const CACHE_WorkspaceInvitationsTag = (organizationId: string) =>
  `organization_${organizationId}_invitations`;

export const CACHE_WorkspaceInvitationByIdTag = (invitationId: string) =>
  `invitation_${invitationId}`;

export const CACHE_WorkspaceInvitationsByTeamIdTag = (teamId: string) =>
  `workspace_team_${teamId}_invitations`;

export const CACHE_PendingWorkspaceInvitationsByEmailTag = (email: string) =>
  `invitation_email_${normalizeWorkspaceInvitationEmail(email)}`;

const getWorkspaceInvitationCacheTags = ({
  invitationId,
  organizationId,
  teamId,
  email,
}: {
  invitationId?: string | null;
  organizationId?: string | null;
  teamId?: string | null;
  email?: string | null;
}) =>
  Array.from(
    new Set([
      ...(organizationId ? [CACHE_WorkspaceInvitationsTag(organizationId)] : []),
      ...(invitationId ? [CACHE_WorkspaceInvitationByIdTag(invitationId)] : []),
      ...(teamId ? [CACHE_WorkspaceInvitationsByTeamIdTag(teamId)] : []),
      ...(email ? [CACHE_PendingWorkspaceInvitationsByEmailTag(email)] : []),
    ])
  );

export const updateWorkspaceInvitationCache = (options: {
  invitationId?: string | null;
  organizationId?: string | null;
  teamId?: string | null;
  email?: string | null;
}) => updateTags(getWorkspaceInvitationCacheTags(options));

export const revalidateWorkspaceInvitationCache = (options: {
  invitationId?: string | null;
  organizationId?: string | null;
  teamId?: string | null;
  email?: string | null;
}) => revalidateTags(getWorkspaceInvitationCacheTags(options));
