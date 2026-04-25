import { headers } from "next/headers";
import React, { Suspense } from "react";
import { detectOGBots } from "@lib/routes";
import { unauthorized } from "next/navigation";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";

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

  const userId = await loadCurrentUserId();
  if (userId) {
    return children;
  }

  unauthorized();
}
