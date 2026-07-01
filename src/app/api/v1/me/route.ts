import type { NextRequest } from "next/server";
import { requireApiKey } from "@features/api-keys/api-keys-auth";
import { apiDataResponse, withApiKeyRouteErrors } from "@features/api-keys/api-keys-errors";
import { API_KEY_REQUIRED_PERMISSIONS } from "@features/api-keys/api-keys-permissions";

export async function GET(request: NextRequest) {
  return withApiKeyRouteErrors(async () => {
    const principal = await requireApiKey(request, API_KEY_REQUIRED_PERMISSIONS.basicRead);

    return apiDataResponse({
      principal: {
        type: principal.type,
        userId: principal.type === "user" ? principal.userId : null,
        organizationId: principal.type === "organization" ? principal.organizationId : null,
      },
      key: {
        id: principal.keyId,
        start: principal.keyStart,
        configId: principal.configId,
      },
      permissions: principal.permissions ?? {},
    });
  });
}
