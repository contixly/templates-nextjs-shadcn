import type { Metadata } from "next";
import React from "react";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { UserProfile } from "@features/accounts/components/user-profile";
import { buildMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.profile);

export default function ProfilePage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return <UserProfile loadCurrentUserPromise={loadCurrentUserPromise} />;
}
