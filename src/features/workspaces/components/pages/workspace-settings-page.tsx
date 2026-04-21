"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { useTranslations } from "next-intl";
import { WorkspaceSettingsForm } from "@features/workspaces/components/forms/workspace-settings-form";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

interface WorkspaceSettingsPageProps {
  workspace: WorkspaceWithCounts;
  canChangeDefault?: boolean;
}

export const WorkspaceSettingsPage = ({
  workspace,
  canChangeDefault,
}: WorkspaceSettingsPageProps) => {
  const t = useTranslations("workspaces.ui.settingsPage");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <WorkspaceSettingsForm workspace={workspace} canChangeDefault={canChangeDefault} />
      </CardContent>
    </Card>
  );
};
