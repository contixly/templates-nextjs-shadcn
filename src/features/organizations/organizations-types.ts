export interface OrganizationSessionContext {
  activeOrganizationId?: string | null;
}

export interface OrganizationRouteParams {
  organizationId?: string | null;
  workspaceId?: string | null;
}

export interface OrganizationWorkspaceDto {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  slug?: string;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface BetterAuthOrganizationRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt?: Date | null;
  logo?: string | null;
  metadata?: string | Record<string, unknown> | null;
}

export interface OrganizationWorkspaceRecord extends BetterAuthOrganizationRecord {
  isDefault: boolean;
}

export interface ResolveDefaultOrganizationIdOptions {
  accessibleOrganizationIds: string[];
  activeOrganizationId?: string | null;
  defaultOrganizationId?: string | null;
  fallbackOrganizationId?: string | null;
}

export const CACHE_OrganizationsByUserIdTag = (userId: string) => `organizations_user_${userId}`;
export const CACHE_OrganizationByIdTag = (organizationId: string) =>
  `organization_${organizationId}`;
