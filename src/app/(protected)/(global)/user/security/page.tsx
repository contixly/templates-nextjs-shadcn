import type { Metadata } from "next";
import React from "react";
import { loadCurrentSession, loadCurrentUserSessions } from "@features/accounts/accounts-actions";
import { UserSessions } from "@features/accounts/components/user-sessions";
import { buildMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.security);

export default function SecurityPage() {
  const loadCurrentUserSessionsPromise = loadCurrentUserSessions();
  const loadCurrentSessionPromise = loadCurrentSession();

  return (
    <UserSessions
      loadCurrentUserSessionsPromise={loadCurrentUserSessionsPromise}
      loadCurrentSessionPromise={loadCurrentSessionPromise}
    />
  );
}
