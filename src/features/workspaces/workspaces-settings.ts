import "server-only";

import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
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
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

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
  members: OrganizationMemberListItemDto[];
  canAddMembers: boolean;
  canUpdateMemberRoles: boolean;
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
    members,
    canAddMembers,
    canUpdateMemberRoles,
  };
};
