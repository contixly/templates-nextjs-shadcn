import type { NextRequest } from "next/server";
import { requireApiKey } from "@features/api-keys/api-keys-auth";
import {
  apiDataResponse,
  apiKeyErrors,
  withApiKeyRouteErrors,
} from "@features/api-keys/api-keys-errors";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";
import {
  findManyAccessibleOrganizationsByUserId,
  findOrganizationDtoById,
} from "@features/organizations/organizations-repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiKeyRouteErrors(async () => {
    const principal = await requireApiKey(request, API_KEY_REQUIRED_PERMISSIONS.organizationRead);

    if (principal.type === "user") {
      return apiDataResponse(await findManyAccessibleOrganizationsByUserId(principal.userId));
    }

    const organization = await findOrganizationDtoById(principal.organizationId);
    if (!organization) {
      throw apiKeyErrors.notFound();
    }

    return apiDataResponse([organization]);
  });
}
