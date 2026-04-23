export const WORKSPACE_MANAGEABLE_ROLES = ["member", "admin", "owner"] as const;

export type WorkspaceManageableRole = (typeof WORKSPACE_MANAGEABLE_ROLES)[number];

export interface WorkspaceRoleOption {
  value: WorkspaceManageableRole;
  labelKey: `roles.labels.${WorkspaceManageableRole}`;
}

export const WORKSPACE_ROLE_OPTIONS = WORKSPACE_MANAGEABLE_ROLES.map((role) => ({
  value: role,
  labelKey: `roles.labels.${role}` as const,
})) satisfies WorkspaceRoleOption[];

const WORKSPACE_MANAGEABLE_ROLE_SET = new Set<string>(WORKSPACE_MANAGEABLE_ROLES);

const ASSIGNABLE_ROLES_BY_ACTING_ROLE = {
  member: [],
  admin: ["member", "admin"],
  owner: WORKSPACE_MANAGEABLE_ROLES,
} satisfies Record<WorkspaceManageableRole, readonly WorkspaceManageableRole[]>;

export const splitWorkspaceRoleLabels = (role: string | null | undefined) =>
  Array.from(
    new Set(
      (role ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

export const isWorkspaceManageableRole = (value: unknown): value is WorkspaceManageableRole =>
  typeof value === "string" && WORKSPACE_MANAGEABLE_ROLE_SET.has(value);

export const getPrimaryWorkspaceManageableRole = (
  role: string | null | undefined
): WorkspaceManageableRole | null => {
  const roles = splitWorkspaceRoleLabels(role);

  if (roles.includes("owner")) {
    return "owner";
  }

  if (roles.includes("admin")) {
    return "admin";
  }

  if (roles.includes("member")) {
    return "member";
  }

  return null;
};

export const getSingleWorkspaceManageableRole = (
  role: string | null | undefined
): WorkspaceManageableRole | null => {
  const roles = splitWorkspaceRoleLabels(role);

  return roles.length === 1 && isWorkspaceManageableRole(roles[0]) ? roles[0] : null;
};

export const getAssignableWorkspaceRoles = (
  actorRole: string | null | undefined
): WorkspaceManageableRole[] => {
  const primaryRole = getPrimaryWorkspaceManageableRole(actorRole);

  return primaryRole ? [...ASSIGNABLE_ROLES_BY_ACTING_ROLE[primaryRole]] : [];
};

export const canAssignWorkspaceRole = (
  actorRole: string | null | undefined,
  requestedRole: WorkspaceManageableRole
) => getAssignableWorkspaceRoles(actorRole).includes(requestedRole);

export const canUpdateWorkspaceMemberRole = ({
  actorRole,
  currentUserId,
  targetRole,
  targetUserId,
}: {
  actorRole: string | null | undefined;
  currentUserId: string;
  targetRole: string | null | undefined;
  targetUserId: string;
}) => {
  if (targetUserId === currentUserId) {
    return false;
  }

  const targetManageableRole = getSingleWorkspaceManageableRole(targetRole);
  if (!targetManageableRole) {
    return false;
  }

  const assignableRoles = getAssignableWorkspaceRoles(actorRole);
  if (assignableRoles.length === 0) {
    return false;
  }

  if (targetManageableRole === "owner" && !assignableRoles.includes("owner")) {
    return false;
  }

  return true;
};
