import type { Metadata } from "next";
import React from "react";
import { UserDangerousZone } from "@features/accounts/components/user-dangerous-zone";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { buildMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.danger);

export default function DangerousPage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return <UserDangerousZone loadCurrentUserPromise={loadCurrentUserPromise} />;
}
