"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Spinner } from "@components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { IconUserPlus, IconUsers } from "@tabler/icons-react";
import { toast } from "sonner";
import { accountsTools } from "@features/accounts/accounts-tools";
import { updateWorkspaceMemberRole } from "@features/workspaces/actions/update-workspace-member-role";
import { WorkspaceAddMemberDialog } from "@features/workspaces/components/forms/workspace-add-member-dialog";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import {
  getSingleWorkspaceManageableRole,
  isWorkspaceManageableRole,
  type WorkspaceManageableRole,
} from "@features/workspaces/workspaces-roles";
import type { WorkspaceMemberListItemDto } from "@features/workspaces/workspaces-types";
import { timeTools } from "@lib/time";
import { useLocale, useTranslations } from "next-intl";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceSettingsUsersPageProps {
  organizationId: string;
  members: WorkspaceMemberListItemDto[];
  currentUserId: string;
  canAddMembers: boolean;
  canUpdateMemberRoles: boolean;
  assignableWorkspaceRoles: WorkspaceManageableRole[];
}

const getDisplayName = (member: WorkspaceMemberListItemDto) => member.name.trim() || member.email;

const getMemberRoleValue = (member: WorkspaceMemberListItemDto) =>
  member.role ?? member.roleLabels.join(",");

const getRoleLabel = (roleLabel: string, tRoles: (role: WorkspaceManageableRole) => string) =>
  isWorkspaceManageableRole(roleLabel) ? tRoles(roleLabel) : roleLabel;

const canRenderRoleControl = ({
  assignableWorkspaceRoles,
  currentRole,
}: {
  assignableWorkspaceRoles: WorkspaceManageableRole[];
  currentRole: WorkspaceManageableRole | null;
}) => {
  if (!currentRole || assignableWorkspaceRoles.length === 0) {
    return false;
  }

  return currentRole !== "owner" || assignableWorkspaceRoles.includes("owner");
};

interface WorkspaceMemberRoleControlProps {
  organizationId: string;
  member: WorkspaceMemberListItemDto;
  displayName: string;
  currentRole: WorkspaceManageableRole;
  assignableWorkspaceRoles: WorkspaceManageableRole[];
}

const WorkspaceMemberRoleControl = ({
  organizationId,
  member,
  displayName,
  currentRole,
  assignableWorkspaceRoles,
}: WorkspaceMemberRoleControlProps) => {
  const t = useTranslations("workspaces.ui.settingsUsersPage");
  const tRoles = useTranslations("workspaces.ui.roles.labels");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateRole = (nextRole: WorkspaceManageableRole) => {
    if (nextRole === currentRole) {
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceMemberRole({
        organizationId,
        memberId: member.id,
        role: nextRole,
      });

      if (result.success) {
        toast.success(t("roleUpdateSuccess"));
        router.refresh();
        return;
      }

      toast.error(t("roleUpdateErrorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ??
          t("roleUpdateUnknownError"),
      });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentRole}
        onValueChange={(value) => {
          if (isWorkspaceManageableRole(value)) {
            updateRole(value);
          }
        }}
        disabled={isPending}
      >
        <SelectTrigger
          aria-label={t("table.roleSelectLabel", { name: displayName })}
          className="w-32"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {assignableWorkspaceRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {tRoles(role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending ? <Spinner aria-hidden="true" /> : null}
    </div>
  );
};

interface WorkspaceMemberRoleLabelsProps {
  member: WorkspaceMemberListItemDto;
  noRolesLabel: string;
  tRoles: (role: WorkspaceManageableRole) => string;
}

const WorkspaceMemberRoleLabels = ({
  member,
  noRolesLabel,
  tRoles,
}: WorkspaceMemberRoleLabelsProps) => {
  if (member.roleLabels.length === 0) {
    return <span className="text-muted-foreground">{noRolesLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {member.roleLabels.map((roleLabel) => (
        <Badge key={`${member.id}-${roleLabel}`} variant="outline">
          {getRoleLabel(roleLabel, tRoles)}
        </Badge>
      ))}
    </div>
  );
};

export const WorkspaceSettingsUsersPage = ({
  organizationId,
  members,
  currentUserId,
  canAddMembers,
  canUpdateMemberRoles,
  assignableWorkspaceRoles,
}: WorkspaceSettingsUsersPageProps) => {
  const tPage = useTranslations("workspaces.pages.settings_users");
  const t = useTranslations("workspaces.ui.settingsUsersPage");
  const tRoles = useTranslations("workspaces.ui.roles.labels");
  const locale = useLocale();
  const currentMember = members.find((member) => member.userId === currentUserId) ?? null;
  const otherMembers = members.filter((member) => member.userId !== currentUserId);
  const outOfPolicyMembers = members.filter((member) => member.isOutsideAllowedEmailDomains);
  const addMemberAction = canAddMembers ? (
    <WorkspaceAddMemberDialog
      organizationId={organizationId}
      assignableRoles={assignableWorkspaceRoles}
      trigger={
        <Button size="sm" variant="outline">
          <IconUserPlus data-icon="inline-start" />
          {t("addMemberAction")}
        </Button>
      }
    />
  ) : null;

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />

      {outOfPolicyMembers.length > 0 ? (
        <div role="alert" className="border-border bg-muted/40 mb-6 space-y-1 border p-4 text-sm">
          <p className="font-medium">{t("domainRestrictionWarningTitle")}</p>
          <p className="text-muted-foreground">
            {t("domainRestrictionWarningDescription", {
              count: String(outOfPolicyMembers.length),
            })}
          </p>
        </div>
      ) : null}

      {members.length === 0 ? (
        <SettingsSection
          title={t("directoryTitle")}
          description={t("directoryDescription")}
          action={addMemberAction}
        >
          <div className="flex flex-col gap-4">
            {!canAddMembers ? (
              <p className="text-muted-foreground text-sm">{t("readOnlyNotice")}</p>
            ) : null}
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconUsers />
                </EmptyMedia>
                <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </SettingsSection>
      ) : (
        <>
          {currentMember ? (
            <SettingsSection
              title={t("currentUserTitle")}
              description={t("currentUserDescription")}
            >
              <section aria-label={t("currentUserSectionLabel")}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar size="lg">
                      {currentMember.image ? (
                        <AvatarImage
                          src={currentMember.image}
                          alt={getDisplayName(currentMember)}
                        />
                      ) : null}
                      <AvatarFallback>
                        {accountsTools.getInitials(getDisplayName(currentMember))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {getDisplayName(currentMember)}
                        </p>
                        <Badge variant="secondary">{t("currentUserBadge")}</Badge>
                        {currentMember.isOutsideAllowedEmailDomains ? (
                          <Badge variant="outline">{t("outsideAllowedDomainsBadge")}</Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        {currentMember.email}
                      </p>
                      {currentMember.roleLabels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentMember.roleLabels.map((roleLabel) => (
                            <Badge key={`${currentMember.id}-${roleLabel}`} variant="outline">
                              {getRoleLabel(roleLabel, tRoles)}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <dl className="flex flex-col gap-1 text-sm sm:text-right">
                    <dt className="text-muted-foreground">{t("joinedLabel")}</dt>
                    <dd>{timeTools.formatDate(currentMember.joinedAt, locale)}</dd>
                  </dl>
                </div>
              </section>
            </SettingsSection>
          ) : null}

          <SettingsSection
            title={t("otherUsersTitle")}
            description={t("otherUsersDescription")}
            action={addMemberAction}
          >
            <div className="flex flex-col gap-4">
              {!canAddMembers ? (
                <p className="text-muted-foreground text-sm">{t("readOnlyNotice")}</p>
              ) : null}
              {otherMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.columns.user")}</TableHead>
                      <TableHead>{t("table.columns.email")}</TableHead>
                      <TableHead>{t("table.columns.roles")}</TableHead>
                      <TableHead>{t("table.columns.joined")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherMembers.map((member) => {
                      const displayName = getDisplayName(member);
                      const currentRole = getSingleWorkspaceManageableRole(
                        getMemberRoleValue(member)
                      );
                      const canEditRole =
                        canUpdateMemberRoles &&
                        canRenderRoleControl({
                          assignableWorkspaceRoles,
                          currentRole,
                        });

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="min-w-48">
                            <div className="flex items-center gap-3">
                              <Avatar size="sm">
                                {member.image ? (
                                  <AvatarImage src={member.image} alt={displayName} />
                                ) : null}
                                <AvatarFallback>
                                  {accountsTools.getInitials(displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 space-y-1">
                                <span className="block truncate font-medium">{displayName}</span>
                                {member.isOutsideAllowedEmailDomains ? (
                                  <Badge variant="outline">{t("outsideAllowedDomainsBadge")}</Badge>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{member.email}</TableCell>
                          <TableCell>
                            {canEditRole && currentRole ? (
                              <WorkspaceMemberRoleControl
                                organizationId={organizationId}
                                member={member}
                                displayName={displayName}
                                currentRole={currentRole}
                                assignableWorkspaceRoles={assignableWorkspaceRoles}
                              />
                            ) : (
                              <WorkspaceMemberRoleLabels
                                member={member}
                                noRolesLabel={t("table.noRoles")}
                                tRoles={tRoles}
                              />
                            )}
                          </TableCell>
                          <TableCell>{timeTools.formatDate(member.joinedAt, locale)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconUsers />
                    </EmptyMedia>
                    <EmptyTitle>{t("othersEmptyTitle")}</EmptyTitle>
                    <EmptyDescription>{t("othersEmptyDescription")}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </SettingsSection>
        </>
      )}
    </>
  );
};
