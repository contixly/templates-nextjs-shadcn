import "server-only";

import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import {
  countAccessibleOrganizationsByUserId,
  findManyAccessibleOrganizationMembersByIdAndUserId,
  findWorkspaceDtoByKeyAndUserId,
} from "@features/organizations/organizations-repository";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import type { OrganizationMemberListItemDto } from "@features/organizations/organizations-types";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

export interface WorkspaceSettingsPageContext {
  workspace: WorkspaceWithCounts;
  canChangeDefault: boolean;
  canonicalOrganizationKey: string;
}

export interface WorkspaceSettingsUsersPageContext extends WorkspaceSettingsPageContext {
  currentUserId: string;
  members: OrganizationMemberListItemDto[];
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
  const [workspace, accessibleOrganizationsCount] = await Promise.all([
    findWorkspaceDtoByKeyAndUserId(organizationKey, userId),
    countAccessibleOrganizationsByUserId(userId),
  ]);

  if (!workspace) {
    forbidden();
  }

  return {
    workspace: workspace as WorkspaceWithCounts,
    canChangeDefault: accessibleOrganizationsCount > 1,
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
  const members = await findManyAccessibleOrganizationMembersByIdAndUserId(
    workspaceContext.workspace.id,
    userId
  );

  return {
    ...workspaceContext,
    currentUserId: userId,
    members,
  };
};
