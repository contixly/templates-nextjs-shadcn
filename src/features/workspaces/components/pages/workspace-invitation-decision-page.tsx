"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { acceptWorkspaceInvitation } from "@features/workspaces/actions/accept-workspace-invitation";
import { rejectWorkspaceInvitation } from "@features/workspaces/actions/reject-workspace-invitation";
import type { WorkspaceInvitationDecisionContext } from "@features/workspaces/workspaces-invitations-types";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import { timeTools } from "@lib/time";
import routes from "@features/routes";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceInvitationDecisionPageProps {
  context: WorkspaceInvitationDecisionContext;
}

export const WorkspaceInvitationDecisionPage = ({
  context,
}: WorkspaceInvitationDecisionPageProps) => {
  const t = useTranslations("workspaces.ui.invitationDecisionPage");
  const tAny = useAnyTranslations("workspaces");
  const locale = useLocale();
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"accept" | "reject" | null>(null);
  const invitation = context.invitation;

  const submitAccept = () => {
    startTransition(async () => {
      setPendingAction("accept");
      const result = await acceptWorkspaceInvitation({ invitationId: invitation.id });
      setPendingAction(null);

      if (result.success && result.data) {
        toast.success(t("acceptSuccess"));
        router.replace(
          routes.dashboard.pages.organization_dashboard.path({
            organizationKey: result.data.slug ?? result.data.id,
          })
        );
        router.refresh();
        return;
      }

      toast.error(t("errorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError"),
      });
    });
  };

  const submitReject = () => {
    startTransition(async () => {
      setPendingAction("reject");
      const result = await rejectWorkspaceInvitation({ invitationId: invitation.id });
      setPendingAction(null);

      if (result.success) {
        toast.success(t("rejectSuccess"));
        router.refresh();
        return;
      }

      toast.error(t("errorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError"),
      });
    });
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant={context.canRespond ? "default" : "outline"}>
            {t(`state.${context.state}.label`)}
          </Badge>
        </div>
        <CardDescription>{t(`state.${context.state}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-sm">{t("details.workspace")}</dt>
            <dd className="mt-1 text-sm font-medium">{invitation.organizationName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{t("details.email")}</dt>
            <dd className="mt-1 text-sm font-medium">{invitation.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{t("details.role")}</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {invitation.roleLabels.map((roleLabel) => (
                <Badge key={`${invitation.id}-${roleLabel}`} variant="secondary">
                  {roleLabel}
                </Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{t("details.inviter")}</dt>
            <dd className="mt-1 text-sm font-medium">{invitation.inviterName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{t("details.created")}</dt>
            <dd className="mt-1 text-sm font-medium">
              {timeTools.formatDate(invitation.createdAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">{t("details.expires")}</dt>
            <dd className="mt-1 text-sm font-medium">
              {timeTools.formatDate(invitation.expiresAt, locale)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          {context.canRespond ? (
            <>
              <Button onClick={submitAccept} disabled={pendingAction !== null}>
                {pendingAction === "accept" ? t("acceptPending") : t("acceptAction")}
              </Button>
              <Button variant="outline" onClick={submitReject} disabled={pendingAction !== null}>
                {pendingAction === "reject" ? t("rejectPending") : t("rejectAction")}
              </Button>
            </>
          ) : null}

          {context.state === "already-member" ? (
            <Button asChild variant="outline">
              <Link
                href={routes.dashboard.pages.organization_dashboard.path({
                  organizationKey: invitation.organizationSlug ?? invitation.organizationId,
                })}
              >
                {t("openWorkspaceAction")}
              </Link>
            </Button>
          ) : null}

          <Button asChild variant="ghost">
            <Link href={routes.accounts.pages.invitations.path()}>
              {t("viewInvitationsAction")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
