import "server-only";

import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentSession, loadCurrentUserId } from "@features/accounts/accounts-actions";
import {
  countAccessibleOrganizationsByUserId,
  findManyAccessibleOrganizationMembersByIdAndUserId,
  findOrganizationMemberByOrganizationIdAndUserId,
  findWorkspaceDtoByKeyAndUserId,
} from "@features/organizations/organizations-repository";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import type { OrganizationMemberListItemDto } from "@features/organizations/organizations-types";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";
import {
  getAssignableWorkspaceRoles,
  type WorkspaceManageableRole,
} from "@features/workspaces/workspaces-roles";
import type {
  WorkspaceMemberListItemDto,
  WorkspaceWithCounts,
} from "@features/workspaces/workspaces-types";
import { evaluateWorkspaceEmailDomainEligibility } from "@features/workspaces/workspaces-domain-restrictions";
import {
  findManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId,
  findManyWorkspaceTeamMembersByTeamIdAndUserId,
  findManyWorkspaceTeamsByOrganizationIdAndUserId,
} from "@features/workspaces/workspaces-teams-repository";
import type {
  WorkspaceTeamAssignableMemberDto,
  WorkspaceTeamListItemDto,
  WorkspaceTeamMemberDto,
} from "@features/workspaces/workspaces-teams-types";

export interface WorkspaceSettingsPageContext {
  workspace: WorkspaceWithCounts;
  canUpdateWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canCreateInvitations: boolean;
  currentMemberRole: string | null;
  assignableWorkspaceRoles: WorkspaceManageableRole[];
  canonicalOrganizationKey: string;
}

export interface WorkspaceSettingsUsersPageContext extends WorkspaceSettingsPageContext {
  currentUserId: string;
  members: WorkspaceMemberListItemDto[];
  canAddMembers: boolean;
  canUpdateMemberRoles: boolean;
}

export interface WorkspaceSettingsTeamsPageContext extends WorkspaceSettingsPageContext {
  currentUserId: string;
  teams: WorkspaceTeamListItemDto[];
  teamMembersByTeamId: Record<string, WorkspaceTeamMemberDto[]>;
  assignableMembers: WorkspaceTeamAssignableMemberDto[];
  activeTeamId: string | null;
  canCreateTeams: boolean;
  canUpdateTeams: boolean;
  canDeleteTeams: boolean;
  canAddTeamMembers: boolean;
  canRemoveTeamMembers: boolean;
}

const loadRequiredCurrentUserId = async () => {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

  return userId;
};

const loadWorkspaceSettingsPageContextForUser = async (
  organizationKey: string,
  userId: string
): Promise<WorkspaceSettingsPageContext> => {
  const workspace = await findWorkspaceDtoByKeyAndUserId(organizationKey, userId);

  if (!workspace) {
    forbidden();
  }

  const [
    accessibleOrganizationsCount,
    canUpdateWorkspace,
    canDeleteWorkspace,
    canCreateInvitations,
    currentMember,
  ] = await Promise.all([
    countAccessibleOrganizationsByUserId(userId),
    hasWorkspacePermission(workspace.id, { organization: ["update"] }),
    hasWorkspacePermission(workspace.id, { organization: ["delete"] }),
    hasWorkspacePermission(workspace.id, { invitation: ["create"] }),
    findOrganizationMemberByOrganizationIdAndUserId(workspace.id, userId, { role: true }),
  ]);
  const currentMemberRole = currentMember?.role ?? null;

  return {
    workspace: workspace as WorkspaceWithCounts,
    canUpdateWorkspace,
    canDeleteWorkspace: canDeleteWorkspace && accessibleOrganizationsCount > 1,
    canCreateInvitations,
    currentMemberRole,
    assignableWorkspaceRoles: getAssignableWorkspaceRoles(currentMemberRole),
    canonicalOrganizationKey: getOrganizationRouteKey(workspace),
  };
};

const withWorkspaceMemberDomainPolicyStatus = (
  members: OrganizationMemberListItemDto[],
  workspace: WorkspaceWithCounts
): WorkspaceMemberListItemDto[] =>
  members.map((member) => {
    const eligibility = evaluateWorkspaceEmailDomainEligibility(workspace.metadata, member.email);

    return {
      ...member,
      emailDomain: eligibility.emailDomain,
      isOutsideAllowedEmailDomains: !eligibility.allowed,
    };
  });

export const loadWorkspaceSettingsPageContext = async (
  organizationKey: string
): Promise<WorkspaceSettingsPageContext> => {
  const userId = await loadRequiredCurrentUserId();

  return loadWorkspaceSettingsPageContextForUser(organizationKey, userId);
};

export const loadWorkspaceSettingsUsersPageContext = async (
  organizationKey: string
): Promise<WorkspaceSettingsUsersPageContext> => {
  const userId = await loadRequiredCurrentUserId();
  const workspaceContext = await loadWorkspaceSettingsPageContextForUser(organizationKey, userId);
  const [members, canAddMembers, canUpdateMemberRoles] = await Promise.all([
    findManyAccessibleOrganizationMembersByIdAndUserId(workspaceContext.workspace.id, userId),
    hasWorkspacePermission(workspaceContext.workspace.id, { member: ["create"] }),
    hasWorkspacePermission(workspaceContext.workspace.id, { member: ["update"] }),
  ]);

  return {
    ...workspaceContext,
    currentUserId: userId,
    members: withWorkspaceMemberDomainPolicyStatus(members, workspaceContext.workspace),
    canAddMembers,
    canUpdateMemberRoles,
  };
};

export const loadWorkspaceSettingsTeamsPageContext = async (
  organizationKey: string
): Promise<WorkspaceSettingsTeamsPageContext> => {
  const userId = await loadRequiredCurrentUserId();
  const workspaceContext = await loadWorkspaceSettingsPageContextForUser(organizationKey, userId);

  const [
    teams,
    assignableMembers,
    canCreateTeams,
    canUpdateTeams,
    canDeleteTeams,
    canAddTeamMembers,
    canRemoveTeamMembers,
    currentSession,
  ] = await Promise.all([
    findManyWorkspaceTeamsByOrganizationIdAndUserId(workspaceContext.workspace.id, userId),
    findManyWorkspaceAssignableTeamMembersByOrganizationIdAndUserId(
      workspaceContext.workspace.id,
      userId
    ),
    hasWorkspacePermission(workspaceContext.workspace.id, { team: ["create"] }),
    hasWorkspacePermission(workspaceContext.workspace.id, { team: ["update"] }),
    hasWorkspacePermission(workspaceContext.workspace.id, { team: ["delete"] }),
    hasWorkspacePermission(workspaceContext.workspace.id, { member: ["update"] }),
    hasWorkspacePermission(workspaceContext.workspace.id, { member: ["delete"] }),
    loadCurrentSession(),
  ]);

  const teamMembersEntries = await Promise.all(
    teams.map(async (team) => [
      team.id,
      await findManyWorkspaceTeamMembersByTeamIdAndUserId(team.id, team.organizationId, userId),
    ])
  );
  const sessionWithActiveTeam = currentSession as { activeTeamId?: string | null } | null;

  return {
    ...workspaceContext,
    currentUserId: userId,
    teams,
    teamMembersByTeamId: Object.fromEntries(teamMembersEntries),
    assignableMembers,
    activeTeamId: sessionWithActiveTeam?.activeTeamId ?? null,
    canCreateTeams,
    canUpdateTeams,
    canDeleteTeams,
    canAddTeamMembers,
    canRemoveTeamMembers,
  };
};
