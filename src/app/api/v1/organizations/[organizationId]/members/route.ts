import type { NextRequest } from "next/server";
import { requireApiKey, requireApiOrganizationAccess } from "@features/api-keys/api-keys-auth";
import {
  apiDataResponse,
  apiKeyErrors,
  withApiKeyRouteErrors,
} from "@features/api-keys/api-keys-errors";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";
import {
  findManyOrganizationMembersByOrganizationId,
  findOrganizationDtoById,
} from "@features/organizations/organizations-repository";

interface OrganizationMembersRouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, context: OrganizationMembersRouteContext) {
  return withApiKeyRouteErrors(async () => {
    const { organizationId } = await context.params;
    const principal = await requireApiKey(
      request,
      API_KEY_REQUIRED_PERMISSIONS.organizationMembersRead
    );
    await requireApiOrganizationAccess(principal, organizationId);

    const organization = await findOrganizationDtoById(organizationId);
    if (!organization) {
      throw apiKeyErrors.notFound();
    }

    return apiDataResponse(await findManyOrganizationMembersByOrganizationId(organizationId));
  });
}
