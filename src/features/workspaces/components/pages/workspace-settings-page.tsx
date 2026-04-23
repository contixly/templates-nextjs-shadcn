"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { useTranslations } from "next-intl";
import { WorkspaceDeleteDialog } from "@features/workspaces/components/forms/workspace-delete-dialog";
import { WorkspaceSettingsForm } from "@features/workspaces/components/forms/workspace-settings-form";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

interface WorkspaceSettingsPageProps {
  workspace: WorkspaceWithCounts;
  canUpdateWorkspace?: boolean;
  canChangeDefault?: boolean;
  canDeleteWorkspace?: boolean;
}

export const WorkspaceSettingsPage = ({
  workspace,
  canUpdateWorkspace = true,
  canChangeDefault,
  canDeleteWorkspace = false,
}: WorkspaceSettingsPageProps) => {
  const t = useTranslations("workspaces.ui.settingsPage");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!canUpdateWorkspace ? (
            <p className="text-muted-foreground text-sm">{t("readOnlyNotice")}</p>
          ) : null}

          <WorkspaceSettingsForm
            workspace={workspace}
            canUpdateWorkspace={canUpdateWorkspace}
            canChangeDefault={canChangeDefault}
          />

          {canDeleteWorkspace ? (
            <section className="space-y-3 border-t pt-6">
              <div className="space-y-1">
                <h2 className="text-sm font-medium">{t("dangerZoneTitle")}</h2>
                <p className="text-muted-foreground text-sm">{t("dangerZoneDescription")}</p>
              </div>

              <WorkspaceDeleteDialog workspace={workspace} />
            </section>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
