import type { NextRequest } from "next/server";
import { requireApiKey, requireApiOrganizationAccess } from "@features/api-keys/api-keys-auth";
import {
  apiDataResponse,
  apiKeyErrors,
  withApiKeyRouteErrors,
} from "@features/api-keys/api-keys-errors";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";
import { findOrganizationDtoById } from "@features/organizations/organizations-repository";
import { findManyWorkspaceTeamsByOrganizationId } from "@features/workspaces/workspaces-teams-repository";

interface OrganizationTeamsRouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, context: OrganizationTeamsRouteContext) {
  return withApiKeyRouteErrors(async () => {
    const { organizationId } = await context.params;
    const principal = await requireApiKey(
      request,
      API_KEY_REQUIRED_PERMISSIONS.organizationTeamsRead
    );
    await requireApiOrganizationAccess(principal, organizationId);

    const organization = await findOrganizationDtoById(organizationId);
    if (!organization) {
      throw apiKeyErrors.notFound();
    }

    return apiDataResponse(await findManyWorkspaceTeamsByOrganizationId(organizationId));
  });
}
