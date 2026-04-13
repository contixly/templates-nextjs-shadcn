import React from "react";
import { NavUserSettings } from "@features/accounts/components/nav/nav-user-settings";

export default async function UserSettingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 md:gap-8">
      <NavUserSettings />
      <main className="max-w-2xl min-w-0 flex-1 space-y-6 px-2 md:mt-4 md:px-0">{children}</main>
    </div>
  );
}
