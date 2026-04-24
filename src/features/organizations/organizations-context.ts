import type {
  OrganizationRouteIdentity,
  OrganizationRouteParams,
  OrganizationSessionContext,
  ResolveDashboardOrganizationIdOptions,
} from "@features/organizations/organizations-types";

export const resolveUrlOrganizationKey = ({
  organizationKey,
  organizationId,
}: OrganizationRouteParams): string | null => organizationKey ?? organizationId ?? null;

export const getOrganizationRouteKey = ({ id, slug }: OrganizationRouteIdentity): string =>
  slug ?? id;

export const organizationMatchesRouteKey = (
  organization: OrganizationRouteIdentity,
  organizationKey: string | null | undefined
): boolean =>
  Boolean(organizationKey) && [organization.id, organization.slug].includes(organizationKey);

export const findOrganizationByRouteKey = <T extends OrganizationRouteIdentity>(
  organizations: readonly T[],
  organizationKey: string | null | undefined
): T | null =>
  organizations.find((organization) =>
    organizationMatchesRouteKey(organization, organizationKey)
  ) ?? null;

export const getActiveOrganizationId = (
  session: OrganizationSessionContext | null | undefined
): string | null => session?.activeOrganizationId ?? null;

export const resolveDashboardOrganizationId = ({
  accessibleOrganizationIds,
  activeOrganizationId,
  fallbackOrganizationId,
}: ResolveDashboardOrganizationIdOptions): string | null => {
  const accessibleOrganizationIdSet = new Set(accessibleOrganizationIds);

  const preferredOrganizationIds = [activeOrganizationId, fallbackOrganizationId];

  for (const organizationId of preferredOrganizationIds) {
    if (organizationId && accessibleOrganizationIdSet.has(organizationId)) {
      return organizationId;
    }
  }

  return null;
};
