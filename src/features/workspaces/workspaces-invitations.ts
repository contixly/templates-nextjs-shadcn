import "server-only";

import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUser, loadCurrentUserId } from "@features/accounts/accounts-actions";
import {
  findManyAccessibleOrganizationsByUserId,
  findOrganizationMemberByOrganizationIdAndUserId,
} from "@features/organizations/organizations-repository";
import {
  findManyPendingWorkspaceInvitationsByEmail,
  findManyWorkspaceInvitationsByOrganizationIdAndUserId,
  findWorkspaceInvitationById,
} from "@features/workspaces/workspaces-invitations-repository";
import {
  type WorkspaceInvitationDecisionContext,
  type WorkspaceInvitationDto,
  normalizeWorkspaceInvitationEmail,
  withResolvedWorkspaceInvitationDisplayStatus,
} from "@features/workspaces/workspaces-invitations-types";
import {
  loadWorkspaceSettingsPageContext,
  type WorkspaceSettingsPageContext,
} from "@features/workspaces/workspaces-settings";

export interface WorkspaceSettingsInvitationsPageContext extends WorkspaceSettingsPageContext {
  invitations: WorkspaceInvitationDto[];
  canCreateInvitations: boolean;
}

const loadRequiredCurrentUserId = async () => {
  const userId = await loadCurrentUserId();

  if (!userId) {
    unauthorized();
  }

  return userId;
};

const loadRequiredCurrentUser = async () => {
  const user = await loadCurrentUser();

  if (!user) {
    unauthorized();
  }

  return user;
};

export const loadWorkspaceSettingsInvitationsPageContext = async (
  organizationKey: string
): Promise<WorkspaceSettingsInvitationsPageContext> => {
  const [userId, workspaceContext] = await Promise.all([
    loadRequiredCurrentUserId(),
    loadWorkspaceSettingsPageContext(organizationKey),
  ]);

  if (!workspaceContext.canCreateInvitations) {
    forbidden();
  }

  const invitations = await findManyWorkspaceInvitationsByOrganizationIdAndUserId(
    workspaceContext.workspace.id,
    userId
  );
  const now = new Date();

  return {
    ...workspaceContext,
    invitations: invitations.map((invitation) =>
      withResolvedWorkspaceInvitationDisplayStatus(invitation, now)
    ),
  };
};

export const loadCurrentUserPendingWorkspaceInvitations = async () => {
  const user = await loadRequiredCurrentUser();

  const [invitations, accessibleOrganizations] = await Promise.all([
    findManyPendingWorkspaceInvitationsByEmail(user.email),
    findManyAccessibleOrganizationsByUserId(user.id),
  ]);

  const accessibleOrganizationIds = new Set(
    accessibleOrganizations.map((organization) => organization.id)
  );
  const now = new Date();

  return invitations.filter((invitation) => {
    const resolvedInvitation = withResolvedWorkspaceInvitationDisplayStatus(invitation, now);

    return (
      resolvedInvitation.displayStatus === "pending" &&
      !accessibleOrganizationIds.has(resolvedInvitation.organizationId)
    );
  });
};

export const loadWorkspaceInvitationDecisionPageContext = async (
  invitationId: string
): Promise<WorkspaceInvitationDecisionContext | null> => {
  const [userId, user, invitation] = await Promise.all([
    loadRequiredCurrentUserId(),
    loadRequiredCurrentUser(),
    findWorkspaceInvitationById(invitationId),
  ]);

  if (!invitation) {
    return null;
  }
  const resolvedInvitation = withResolvedWorkspaceInvitationDisplayStatus(invitation);
  const normalizedUserEmail = normalizeWorkspaceInvitationEmail(user.email);
  const normalizedInvitationEmail = normalizeWorkspaceInvitationEmail(resolvedInvitation.email);

  if (normalizedInvitationEmail !== normalizedUserEmail) {
    return {
      invitation: null,
      state: "recipient-mismatch",
      canRespond: false,
    };
  }

  if (resolvedInvitation.displayStatus !== "pending") {
    return {
      invitation: resolvedInvitation,
      state: resolvedInvitation.displayStatus,
      canRespond: false,
    };
  }

  if (!user.emailVerified) {
    return {
      invitation: resolvedInvitation,
      state: "email-verification-required",
      canRespond: false,
    };
  }

  const existingMembership = await findOrganizationMemberByOrganizationIdAndUserId(
    resolvedInvitation.organizationId,
    userId,
    {
      id: true,
    }
  );

  if (existingMembership) {
    return {
      invitation: resolvedInvitation,
      state: "already-member",
      canRespond: false,
    };
  }

  return {
    invitation: resolvedInvitation,
    state: "pending",
    canRespond: true,
  };
};
