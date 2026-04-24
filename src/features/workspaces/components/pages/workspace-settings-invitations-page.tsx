"use client";

import { useLocale, useTranslations } from "next-intl";
import { IconMail } from "@tabler/icons-react";
import { Badge } from "@components/ui/badge";
import { CopyButton } from "@components/ui/custom/copy-button";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { timeTools } from "@lib/time";
import type { WorkspaceInvitationDto } from "@features/workspaces/workspaces-invitations-types";
import type { WorkspaceManageableRole } from "@features/workspaces/workspaces-roles";
import { WorkspaceCreateInvitationDialog } from "@features/workspaces/components/forms/workspace-create-invitation-dialog";

interface WorkspaceSettingsInvitationsPageProps {
  organizationId: string;
  invitations: WorkspaceInvitationDto[];
  canCreateInvitations: boolean;
  assignableWorkspaceRoles: WorkspaceManageableRole[];
}

const getStatusVariant = (status: WorkspaceInvitationDto["displayStatus"]) => {
  switch (status) {
    case "accepted":
      return "secondary";
    case "rejected":
    case "canceled":
    case "expired":
      return "outline";
    case "pending":
    default:
      return "default";
  }
};

export const WorkspaceSettingsInvitationsPage = ({
  organizationId,
  invitations,
  canCreateInvitations,
  assignableWorkspaceRoles,
}: WorkspaceSettingsInvitationsPageProps) => {
  const tCommon = useTranslations("common");
  const tPage = useTranslations("workspaces.pages.settings_invitations");
  const t = useTranslations("workspaces.ui.settingsInvitationsPage");
  const locale = useLocale();

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />

      <SettingsSection
        title={t("sectionTitle")}
        description={t("sectionDescription")}
        action={
          canCreateInvitations ? (
            <WorkspaceCreateInvitationDialog
              organizationId={organizationId}
              assignableRoles={assignableWorkspaceRoles}
            />
          ) : null
        }
      >
        {invitations.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconMail />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.email")}</TableHead>
                <TableHead>{t("table.columns.role")}</TableHead>
                <TableHead>{t("table.columns.inviter")}</TableHead>
                <TableHead>{t("table.columns.created")}</TableHead>
                <TableHead>{t("table.columns.expires")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead className="text-right">{t("table.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {invitation.roleLabels.map((roleLabel) => (
                        <Badge key={`${invitation.id}-${roleLabel}`} variant="outline">
                          {roleLabel}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{invitation.inviterName}</TableCell>
                  <TableCell>{timeTools.formatDate(invitation.createdAt, locale)}</TableCell>
                  <TableCell>{timeTools.formatDate(invitation.expiresAt, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invitation.displayStatus)}>
                      {t(`status.${invitation.displayStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CopyButton
                      text={invitation.invitationUrl}
                      variant="outline"
                      size="sm"
                      copyLabel={tCommon("words.verbs.copy")}
                      copiedLabel={t("copied")}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>
    </>
  );
};
