import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";

export async function WorkspaceSettingsNav({
  organizationId,
  organizationKey,
}: Readonly<{
  organizationId: string;
  organizationKey: string;
}>) {
  const [canCreateInvitations, canReadApiKeys] = await Promise.all([
    hasWorkspacePermission(organizationId, {
      invitation: ["create"],
    }),
    hasWorkspacePermission(organizationId, {
      apiKey: ["read"],
    }),
  ]);

  return (
    <NavWorkspaceSettings
      organizationKey={organizationKey}
      canCreateInvitations={canCreateInvitations}
      canReadApiKeys={canReadApiKeys}
    />
  );
}
