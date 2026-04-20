import type {
  OrganizationWorkspaceDto,
  OrganizationWorkspaceRecord,
} from "@features/organizations/organizations-types";

export type { OrganizationWorkspaceDto, OrganizationWorkspaceRecord };

const parseMetadata = (metadata: OrganizationWorkspaceRecord["metadata"]) => {
  if (!metadata) {
    return null;
  }

  if (typeof metadata !== "string") {
    return metadata;
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const toWorkspaceDto = (
  organization: OrganizationWorkspaceRecord
): OrganizationWorkspaceDto => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  logo: organization.logo ?? null,
  metadata: parseMetadata(organization.metadata),
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt ?? organization.createdAt,
  isDefault: organization.isDefault,
});
