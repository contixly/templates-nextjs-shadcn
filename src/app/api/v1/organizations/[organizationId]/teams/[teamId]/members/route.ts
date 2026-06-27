import type { NextRequest } from "next/server";
import { requireApiKey, requireApiOrganizationAccess } from "@features/api-keys/api-keys-auth";
import {
  apiDataResponse,
  apiKeyErrors,
  withApiKeyRouteErrors,
} from "@features/api-keys/api-keys-errors";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";
import {
  findManyWorkspaceTeamMembersByTeamIdAndOrganizationId,
  findWorkspaceTeamByIdAndOrganizationId,
} from "@features/workspaces/workspaces-teams-repository";

export const dynamic = "force-dynamic";

interface OrganizationTeamMembersRouteContext {
  params: Promise<{ organizationId: string; teamId: string }>;
}

export async function GET(request: NextRequest, context: OrganizationTeamMembersRouteContext) {
  return withApiKeyRouteErrors(async () => {
    const { organizationId, teamId } = await context.params;
    const principal = await requireApiKey(
      request,
      API_KEY_REQUIRED_PERMISSIONS.organizationTeamMembersRead
    );
    await requireApiOrganizationAccess(principal, organizationId);

    const team = await findWorkspaceTeamByIdAndOrganizationId(teamId, organizationId);
    if (!team) {
      throw apiKeyErrors.notFound();
    }

    return apiDataResponse(
      await findManyWorkspaceTeamMembersByTeamIdAndOrganizationId(teamId, organizationId)
    );
  });
}
