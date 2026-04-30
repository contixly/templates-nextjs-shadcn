"use client";

import { Badge } from "@components/ui/badge";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { useTranslations } from "next-intl";

export type WorkspaceSettingsPlaceholderSection = "invitations" | "users" | "teams" | "roles";

interface WorkspaceSettingsPlaceholderPageProps {
  section: WorkspaceSettingsPlaceholderSection;
  showIntro?: boolean;
}

export const WorkspaceSettingsPlaceholderPage = ({
  section,
  showIntro = true,
}: WorkspaceSettingsPlaceholderPageProps) => {
  const t = useTranslations("workspaces.ui.settingsPlaceholder");

  return (
    <>
      {showIntro ? (
        <SettingsPageIntro
          title={t(`sections.${section}.pageTitle`)}
          description={t(`sections.${section}.pageDescription`)}
        />
      ) : null}
      <SettingsSection
        title={t(`sections.${section}.title`)}
        description={t(`sections.${section}.description`)}
        action={<Badge variant="secondary">{t("badge")}</Badge>}
      >
        <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">
          {t("body")}
        </div>
      </SettingsSection>
    </>
  );
};
