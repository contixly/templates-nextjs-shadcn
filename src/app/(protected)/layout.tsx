import { headers } from "next/headers";
import React, { Suspense } from "react";
import { detectOGBots } from "@lib/routes";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProtectedBotBodyGuard>{children}</ProtectedBotBodyGuard>
    </Suspense>
  );
}

async function ProtectedBotBodyGuard({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  if (detectOGBots(headersList)) {
    return null;
  }

  return children;
}
