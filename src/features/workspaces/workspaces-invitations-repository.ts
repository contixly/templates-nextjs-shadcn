import "server-only";

import type { Prisma } from "@/prisma/generated/client";
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@server/prisma";
import { workspacesLogger } from "@features/workspaces/workspaces-logger";
import {
  buildWorkspaceInvitationUrl,
  CACHE_PendingWorkspaceInvitationsByEmailTag,
  CACHE_WorkspaceInvitationByIdTag,
  CACHE_WorkspaceInvitationsTag,
  normalizeWorkspaceInvitationEmail,
  splitWorkspaceInvitationRoleLabels,
  type WorkspaceInvitationDto,
} from "@features/workspaces/workspaces-invitations-types";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationMembersTag,
  CACHE_OrganizationsByUserIdTag,
} from "@features/organizations/organizations-types";

const logger = workspacesLogger.child({ type: "repository", module: "workspace-invitations" });

const invitationSelect = {
  id: true,
  organizationId: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  inviterId: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  inviter: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.InvitationSelect;

type InvitationRecord = Prisma.InvitationGetPayload<{
  select: typeof invitationSelect;
}>;

const toWorkspaceInvitationDto = (invitation: InvitationRecord): WorkspaceInvitationDto => ({
  id: invitation.id,
  organizationId: invitation.organizationId,
  organizationName: invitation.organization.name,
  organizationSlug: invitation.organization.slug,
  email: invitation.email,
  role: invitation.role,
  roleLabels: splitWorkspaceInvitationRoleLabels(invitation.role),
  status: invitation.status as WorkspaceInvitationDto["status"],
  displayStatus: invitation.status as WorkspaceInvitationDto["displayStatus"],
  expiresAt: invitation.expiresAt,
  createdAt: invitation.createdAt,
  inviterId: invitation.inviterId,
  inviterName: invitation.inviter.name,
  inviterEmail: invitation.inviter.email,
  invitationUrl: buildWorkspaceInvitationUrl(invitation.id),
});

export const findManyWorkspaceInvitationsByOrganizationIdAndUserId = async (
  organizationId: string,
  userId: string
): Promise<WorkspaceInvitationDto[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag(
    CACHE_WorkspaceInvitationsTag(organizationId),
    CACHE_OrganizationByIdTag(organizationId),
    CACHE_OrganizationMembersTag(organizationId),
    CACHE_OrganizationsByUserIdTag(userId)
  );

  logger
    .child({
      function: "findManyWorkspaceInvitationsByOrganizationIdAndUserId",
      organizationId,
      userId,
    })
    .debug("Fetching workspace invitations");

  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: invitationSelect,
  });

  if (invitations.length > 0) {
    cacheTag(
      ...invitations.flatMap((invitation) => [
        CACHE_WorkspaceInvitationByIdTag(invitation.id),
        CACHE_PendingWorkspaceInvitationsByEmailTag(invitation.email),
      ])
    );
  }

  return invitations.map(toWorkspaceInvitationDto);
};

export const findManyPendingWorkspaceInvitationsByEmail = async (
  email: string
): Promise<WorkspaceInvitationDto[]> => {
  "use cache";
  cacheLife("hours");

  const normalizedEmail = normalizeWorkspaceInvitationEmail(email);
  cacheTag(CACHE_PendingWorkspaceInvitationsByEmailTag(normalizedEmail));

  logger
    .child({
      function: "findManyPendingWorkspaceInvitationsByEmail",
      email: normalizedEmail,
    })
    .debug("Fetching pending workspace invitations by email");

  const invitations = await prisma.invitation.findMany({
    where: {
      email: normalizedEmail,
      status: "pending",
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    select: invitationSelect,
  });

  if (invitations.length > 0) {
    cacheTag(
      ...invitations.flatMap((invitation) => [
        CACHE_WorkspaceInvitationByIdTag(invitation.id),
        CACHE_WorkspaceInvitationsTag(invitation.organizationId),
      ])
    );
  }

  return invitations.map(toWorkspaceInvitationDto);
};

export const findWorkspaceInvitationById = async (invitationId: string) => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_WorkspaceInvitationByIdTag(invitationId));

  logger
    .child({ function: "findWorkspaceInvitationById", invitationId })
    .debug("Fetching workspace invitation by id");

  const invitation = await prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
    select: invitationSelect,
  });

  if (!invitation) {
    return null;
  }

  cacheTag(
    CACHE_WorkspaceInvitationsTag(invitation.organizationId),
    CACHE_PendingWorkspaceInvitationsByEmailTag(invitation.email)
  );

  return toWorkspaceInvitationDto(invitation);
};

export const findWorkspaceInvitationDomainRestrictionContext = async (invitationId: string) => {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_WorkspaceInvitationByIdTag(invitationId));

  const invitation = await prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
    select: {
      email: true,
      organizationId: true,
      organization: {
        select: {
          metadata: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  cacheTag(
    CACHE_OrganizationByIdTag(invitation.organizationId),
    CACHE_WorkspaceInvitationsTag(invitation.organizationId)
  );

  return {
    email: invitation.email,
    organizationId: invitation.organizationId,
    organizationMetadata: invitation.organization.metadata,
  };
};
