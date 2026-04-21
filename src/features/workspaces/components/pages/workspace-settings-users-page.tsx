"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { IconUsers } from "@tabler/icons-react";
import { accountsTools } from "@features/accounts/accounts-tools";
import type { OrganizationMemberListItemDto } from "@features/organizations/organizations-types";
import { timeTools } from "@lib/time";
import { useLocale, useTranslations } from "next-intl";

interface WorkspaceSettingsUsersPageProps {
  members: OrganizationMemberListItemDto[];
  currentUserId: string;
}

const getDisplayName = (member: OrganizationMemberListItemDto) =>
  member.name.trim() || member.email;

export const WorkspaceSettingsUsersPage = ({
  members,
  currentUserId,
}: WorkspaceSettingsUsersPageProps) => {
  const t = useTranslations("workspaces.ui.settingsUsersPage");
  const locale = useLocale();
  const currentMember = members.find((member) => member.userId === currentUserId) ?? null;
  const otherMembers = members.filter((member) => member.userId !== currentUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconUsers />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-6">
            {currentMember ? (
              <section className="rounded-lg border p-4" aria-label={t("currentUserSectionLabel")}>
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
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {getDisplayName(currentMember)}
                        </p>
                        <Badge variant="secondary">{t("currentUserBadge")}</Badge>
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        {currentMember.email}
                      </p>
                      {currentMember.roleLabels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentMember.roleLabels.map((roleLabel) => (
                            <Badge key={`${currentMember.id}-${roleLabel}`} variant="outline">
                              {roleLabel}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <dl className="space-y-1 text-sm sm:text-right">
                    <dt className="text-muted-foreground">{t("joinedLabel")}</dt>
                    <dd>{timeTools.formatDate(currentMember.joinedAt, locale)}</dd>
                  </dl>
                </div>
              </section>
            ) : null}

            {otherMembers.length > 0 ? (
              <section aria-label={t("otherUsersSectionLabel")} className="space-y-3">
                <div>
                  <h2 className="text-sm font-medium">{t("otherUsersTitle")}</h2>
                  <p className="text-muted-foreground text-sm">{t("otherUsersDescription")}</p>
                </div>

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
                              <span className="font-medium">{displayName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{member.email}</TableCell>
                          <TableCell>
                            {member.roleLabels.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {member.roleLabels.map((roleLabel) => (
                                  <Badge key={`${member.id}-${roleLabel}`} variant="outline">
                                    {roleLabel}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t("table.noRoles")}</span>
                            )}
                          </TableCell>
                          <TableCell>{timeTools.formatDate(member.joinedAt, locale)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </section>
            ) : currentMember ? (
              <section aria-label={t("otherUsersSectionLabel")}>
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconUsers />
                    </EmptyMedia>
                    <EmptyTitle>{t("othersEmptyTitle")}</EmptyTitle>
                    <EmptyDescription>{t("othersEmptyDescription")}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </section>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
