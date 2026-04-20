import type {
  OrganizationRouteParams,
  OrganizationSessionContext,
  ResolveDefaultOrganizationIdOptions,
} from "@features/organizations/organizations-types";

export const resolveUrlOrganizationId = ({
  organizationId,
}: OrganizationRouteParams): string | null => organizationId ?? null;

export const getActiveOrganizationId = (
  session: OrganizationSessionContext | null | undefined
): string | null => session?.activeOrganizationId ?? null;

export const resolveDefaultOrganizationId = ({
  accessibleOrganizationIds,
  activeOrganizationId,
  defaultOrganizationId,
  fallbackOrganizationId,
}: ResolveDefaultOrganizationIdOptions): string | null => {
  const accessibleOrganizationIdSet = new Set(accessibleOrganizationIds);

  const preferredOrganizationIds = [
    activeOrganizationId,
    defaultOrganizationId,
    fallbackOrganizationId,
  ];

  for (const organizationId of preferredOrganizationIds) {
    if (organizationId && accessibleOrganizationIdSet.has(organizationId)) {
      return organizationId;
    }
  }

  return null;
};
