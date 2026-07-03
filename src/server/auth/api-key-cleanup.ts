import "server-only";

import {
  API_KEY_ORGANIZATION_CONFIG_ID,
  API_KEY_USER_CONFIG_ID,
  type ApiKeyConfigId,
} from "@lib/api-key-config";
import prisma from "@server/prisma";

const deleteApiKeysByReference = (configId: ApiKeyConfigId, referenceId: string) =>
  prisma.apiKey.deleteMany({
    where: {
      configId,
      referenceId,
    },
  });

export const deletePersonalApiKeysForUser = (userId: string) =>
  deleteApiKeysByReference(API_KEY_USER_CONFIG_ID, userId);

export const deleteOrganizationApiKeysForOrganization = (organizationId: string) =>
  deleteApiKeysByReference(API_KEY_ORGANIZATION_CONFIG_ID, organizationId);
