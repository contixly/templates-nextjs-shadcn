import type { Metadata } from "next";
import React from "react";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { UserDangerousZone } from "@features/accounts/components/user-dangerous-zone";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.danger);

export default function DangerousPage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return (
    <SettingsPageSection mode="readable">
      <UserDangerousZone loadCurrentUserPromise={loadCurrentUserPromise} />
    </SettingsPageSection>
  );
}
