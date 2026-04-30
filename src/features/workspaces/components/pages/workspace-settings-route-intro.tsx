"use client";

import { SettingsPageIntro } from "@components/application/settings/settings-shell";
import workspaceRoutes, { WorkspaceSettingsPages } from "@features/workspaces/workspaces-routes";
import { usePageTranslations } from "@hooks/use-page-translations";

type WorkspaceSettingsRouteIntroPageKey = WorkspaceSettingsPages;

export const WorkspaceSettingsRouteIntro = ({
  pageKey,
}: {
  pageKey: WorkspaceSettingsRouteIntroPageKey;
}) => {
  const page = workspaceRoutes.pages[pageKey];
  const translations = usePageTranslations(page);

  return <SettingsPageIntro title={translations.title} description={translations.description} />;
};
