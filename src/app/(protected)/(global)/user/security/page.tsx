import type { Metadata } from "next";
import React from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { loadCurrentSession, loadCurrentUserSessions } from "@features/accounts/accounts-actions";
import { UserSessions } from "@features/accounts/components/user-sessions";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.security);

export default function SecurityPage() {
  const loadCurrentUserSessionsPromise = loadCurrentUserSessions();
  const loadCurrentSessionPromise = loadCurrentSession();

  return (
    <SettingsPageSection mode="readable">
      <UserSessions
        loadCurrentUserSessionsPromise={loadCurrentUserSessionsPromise}
        loadCurrentSessionPromise={loadCurrentSessionPromise}
      />
    </SettingsPageSection>
  );
}
