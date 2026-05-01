import "server-only";

import { APIError } from "better-auth/api";
import type { OrganizationOptions } from "better-auth/plugins";
import { WORKSPACE_ERROR_KEYS } from "@features/workspaces/workspaces-errors";
import { evaluateWorkspaceEmailDomainEligibility } from "@features/workspaces/workspaces-domain-restrictions";
import prisma from "@server/prisma";

type OrganizationHooks = NonNullable<OrganizationOptions["organizationHooks"]>;

type BetterAuthOrganizationPolicyRecord = {
  id: string;
  metadata?: Record<string, unknown> | string | null;
};

type BetterAuthInvitationPolicyRecord = {
  email: string;
  organizationId: string;
  teamId?: unknown;
  teamIds?: unknown;
};

const throwWorkspacePolicyError = (message: string): never => {
  throw new APIError("BAD_REQUEST", {
    message,
  });
};

const normalizeInvitationEmail = (email: string) => email.trim().toLowerCase();

const appendTeamIds = (value: unknown, teamIds: Set<string>) => {
  if (Array.isArray(value)) {
    value.forEach((item) => appendTeamIds(item, teamIds));
    return;
  }

  if (typeof value !== "string") {
    return;
  }

  value
    .split(",")
    .map((teamId) => teamId.trim())
    .filter(Boolean)
    .forEach((teamId) => teamIds.add(teamId));
};

const getInvitationTeamIds = (invitation: BetterAuthInvitationPolicyRecord) => {
  const teamIds = new Set<string>();

  appendTeamIds(invitation.teamId, teamIds);
  appendTeamIds(invitation.teamIds, teamIds);

  return Array.from(teamIds);
};

const assertInvitationDomainPolicy = (
  invitation: BetterAuthInvitationPolicyRecord,
  organization: BetterAuthOrganizationPolicyRecord
) => {
  const domainEligibility = evaluateWorkspaceEmailDomainEligibility(
    organization.metadata,
    normalizeInvitationEmail(invitation.email)
  );

  if (!domainEligibility.allowed) {
    throwWorkspacePolicyError(WORKSPACE_ERROR_KEYS.invitationDomainRestricted);
  }
};

const assertInvitationTeamsBelongToOrganization = async (
  invitation: BetterAuthInvitationPolicyRecord,
  organizationId: string
) => {
  const teamIds = getInvitationTeamIds(invitation);

  if (teamIds.length === 0) {
    return;
  }

  const teams = await prisma.team.findMany({
    where: {
      id: {
        in: teamIds,
      },
      organizationId,
    },
    select: {
      id: true,
    },
  });
  const validTeamIds = new Set(teams.map((team) => team.id));
  const allTeamsBelongToOrganization = teamIds.every((teamId) => validTeamIds.has(teamId));

  if (!allTeamsBelongToOrganization) {
    throwWorkspacePolicyError(WORKSPACE_ERROR_KEYS.invitationTeamInvalid);
  }
};

const assertInvitationPolicy = async (
  invitation: BetterAuthInvitationPolicyRecord,
  organization: BetterAuthOrganizationPolicyRecord
) => {
  assertInvitationDomainPolicy(invitation, organization);
  await assertInvitationTeamsBelongToOrganization(invitation, organization.id);
};

export const betterAuthOrganizationHooks = {
  beforeCreateInvitation: async ({ invitation, organization }) => {
    await assertInvitationPolicy(invitation, organization);
  },
  beforeAcceptInvitation: async ({ invitation, organization }) => {
    await assertInvitationPolicy(invitation, organization);
  },
} satisfies OrganizationHooks;
