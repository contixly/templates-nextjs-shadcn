"use client";

import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { useTranslations } from "next-intl";
import { WorkspaceDeleteDialog } from "@features/workspaces/components/forms/workspace-delete-dialog";
import { WorkspaceSettingsForm } from "@features/workspaces/components/forms/workspace-settings-form";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";

interface WorkspaceSettingsPageProps {
  workspace: WorkspaceWithCounts;
  canUpdateWorkspace?: boolean;
  canDeleteWorkspace?: boolean;
}

export const WorkspaceSettingsPage = ({
  workspace,
  canUpdateWorkspace = true,
  canDeleteWorkspace = false,
}: WorkspaceSettingsPageProps) => {
  const tPage = useTranslations("workspaces.pages.settings_workspace");
  const t = useTranslations("workspaces.ui.settingsPage");

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />

      <SettingsSection title={t("identityTitle")} description={t("identityDescription")}>
        <div className="flex flex-col gap-4">
          {!canUpdateWorkspace ? (
            <p className="text-muted-foreground text-sm">{t("readOnlyNotice")}</p>
          ) : null}

          <WorkspaceSettingsForm workspace={workspace} canUpdateWorkspace={canUpdateWorkspace} />
        </div>
      </SettingsSection>

      {canDeleteWorkspace ? (
        <SettingsSection
          title={t("dangerZoneTitle")}
          description={t("dangerZoneDescription")}
          variant="destructive"
        >
          <WorkspaceDeleteDialog workspace={workspace} />
        </SettingsSection>
      ) : null}
    </>
  );
};
