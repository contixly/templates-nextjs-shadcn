"use client";

import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { useTranslations } from "next-intl";

export type WorkspaceSettingsPlaceholderSection = "invitations" | "users" | "teams" | "roles";

interface WorkspaceSettingsPlaceholderPageProps {
  section: WorkspaceSettingsPlaceholderSection;
}

export const WorkspaceSettingsPlaceholderPage = ({
  section,
}: WorkspaceSettingsPlaceholderPageProps) => {
  const t = useTranslations("workspaces.ui.settingsPlaceholder");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{t(`sections.${section}.title`)}</CardTitle>
          <Badge variant="secondary">{t("badge")}</Badge>
        </div>
        <CardDescription>{t(`sections.${section}.description`)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">
          {t("body")}
        </div>
      </CardContent>
    </Card>
  );
};
