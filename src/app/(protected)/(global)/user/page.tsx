import { redirect } from "next/navigation";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";
import { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.profile);

export default function ProfilePage() {
  redirect(accountsRoutes.pages.profile.path());
}
