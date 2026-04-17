import type { Metadata } from "next";
import React from "react";
import { loadCurrentUser } from "@features/accounts/accounts-actions";
import { UserProfile } from "@features/accounts/components/user-profile";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.profile);

export default function ProfilePage() {
  const loadCurrentUserPromise = loadCurrentUser();

  return <UserProfile loadCurrentUserPromise={loadCurrentUserPromise} />;
}
