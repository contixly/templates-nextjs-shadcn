export interface OrganizationSessionContext {
  activeOrganizationId?: string | null;
}

export interface OrganizationRouteParams {
  organizationKey?: string | null;
  organizationId?: string | null;
}

export interface OrganizationRouteIdentity {
  id: string;
  slug?: string | null;
}

export interface OrganizationWorkspaceDto extends OrganizationRouteIdentity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  slug?: string | null;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface OrganizationMemberUserRecord {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface OrganizationMemberRecord {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: OrganizationMemberUserRecord;
}

export interface OrganizationMemberListItemDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  roleLabels: string[];
  joinedAt: Date;
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

export type OrganizationWorkspaceRecord = BetterAuthOrganizationRecord;

export interface ResolveDashboardOrganizationIdOptions {
  accessibleOrganizationIds: string[];
  activeOrganizationId?: string | null;
  fallbackOrganizationId?: string | null;
}

export const CACHE_OrganizationsByUserIdTag = (userId: string) => `organizations_user_${userId}`;
export const CACHE_OrganizationByIdTag = (organizationId: string) =>
  `organization_${organizationId}`;
export const CACHE_OrganizationMembersTag = (organizationId: string) =>
  `organization_${organizationId}_members`;
