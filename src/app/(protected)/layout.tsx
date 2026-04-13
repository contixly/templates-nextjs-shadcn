import { headers } from "next/headers";
import React, { Suspense } from "react";
import { detectOGBots } from "@lib/routes";
import { USER_ID_HEADER } from "@features/accounts/accounts-types";
import { unauthorized } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ProtectedLayoutWrapper>{children}</ProtectedLayoutWrapper>
    </Suspense>
  );
}

async function ProtectedLayoutWrapper({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  if (detectOGBots(headersList)) {
    return null;
  }

  if (headersList.has(USER_ID_HEADER)) {
    return children;
  }

  unauthorized();
}
