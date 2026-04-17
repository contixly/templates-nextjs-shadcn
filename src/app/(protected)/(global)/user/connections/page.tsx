import type { Metadata } from "next";
import React from "react";
import { UserConnections } from "@features/accounts/components/user-connections";
import { loadCurrentUserAccounts } from "@features/accounts/accounts-actions";
import { getFromCookie } from "@lib/cookies";
import { LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.connections);

export default async function ConnectionsPage() {
  const loadCurrentUserAccountsPromise = loadCurrentUserAccounts();
  const getLastLoginPromise = getFromCookie(LAST_LOGIN_METHOD_KEY);

  return (
    <UserConnections
      loadCurrentUserAccountsPromise={loadCurrentUserAccountsPromise}
      getLastLoginPromise={getLastLoginPromise}
    />
  );
}
