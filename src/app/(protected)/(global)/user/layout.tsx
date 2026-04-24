import React from "react";
import { SettingsPageShell } from "@components/application/settings/settings-shell";
import { NavUserSettings } from "@features/accounts/components/nav/nav-user-settings";

export default async function UserSettingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SettingsPageShell nav={<NavUserSettings />}>{children}</SettingsPageShell>;
}
