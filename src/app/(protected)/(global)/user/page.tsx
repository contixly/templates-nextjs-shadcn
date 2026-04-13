import { redirect } from "next/navigation";
import accountsRoutes from "@features/accounts/accounts-routes";
import type { Metadata } from "next";
import { buildMetadata } from "@lib/metadata";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.profile);

export default function ProfilePage() {
  redirect(accountsRoutes.pages.profile.path());
}
