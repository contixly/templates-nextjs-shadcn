import type { Metadata } from "next";
import React from "react";
import { UserDangerousZone } from "@features/accounts/components/user-dangerous-zone";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.danger);

export default function DangerousPage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return <UserDangerousZone loadCurrentUserPromise={loadCurrentUserPromise} />;
}
