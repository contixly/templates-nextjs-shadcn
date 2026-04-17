import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";
import { AccountErrorPage } from "@features/accounts/components/account-error-page";
import { Suspense } from "react";
import { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.error);

export default function ErrorPage() {
  return (
    <Suspense>
      <AccountErrorPage />;
    </Suspense>
  );
}
