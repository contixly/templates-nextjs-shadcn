import { buildMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";
import { Metadata } from "next";
import { AccountErrorPage } from "@features/accounts/components/account-error-page";
import { Suspense } from "react";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.error);

export default function ErrorPage() {
  return (
    <Suspense>
      <AccountErrorPage />;
    </Suspense>
  );
}
