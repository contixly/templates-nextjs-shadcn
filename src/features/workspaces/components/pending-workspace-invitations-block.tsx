"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { IconMail } from "@tabler/icons-react";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import { timeTools } from "@lib/time";
import routes from "@features/routes";
import type { WorkspaceInvitationDto } from "@features/workspaces/workspaces-invitations-types";

interface PendingWorkspaceInvitationsBlockProps {
  invitations: WorkspaceInvitationDto[];
  showEmptyState?: boolean;
}

export const PendingWorkspaceInvitationsBlock = ({
  invitations,
  showEmptyState = false,
}: PendingWorkspaceInvitationsBlockProps) => {
  const t = useTranslations("workspaces.ui.pendingInvitationsBlock");
  const locale = useLocale();

  if (invitations.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <article key={invitation.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium">{invitation.organizationName}</h2>
                      <Badge variant="outline">{t("pendingBadge")}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t("invitedEmail", { email: invitation.email })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("invitedBy", { inviter: invitation.inviterName })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {invitation.roleLabels.map((roleLabel) => (
                        <Badge key={`${invitation.id}-${roleLabel}`} variant="secondary">
                          {roleLabel}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t("expiresLabel", {
                        date: timeTools.formatDate(invitation.expiresAt, locale),
                      })}
                    </p>
                  </div>

                  <Button asChild className="min-w-fit">
                    <Link
                      href={routes.accounts.pages.invitation.path({
                        invitationId: invitation.id,
                      })}
                    >
                      {t("reviewAction")}
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
