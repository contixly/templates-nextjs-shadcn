import "server-only";

import { forbidden, unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import {
  countAccessibleOrganizationsByUserId,
  findWorkspaceDtoByKeyAndUserId,
} from "@features/organizations/organizations-repository";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

export interface WorkspaceSettingsPageContext {
  workspace: WorkspaceWithCounts;
  canChangeDefault: boolean;
  canonicalOrganizationKey: string;
}

export const loadWorkspaceSettingsPageContext = async (
  organizationKey: string
): Promise<WorkspaceSettingsPageContext> => {
  const userId = await loadCurrentUserId();
  if (!userId) {
    unauthorized();
  }

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
