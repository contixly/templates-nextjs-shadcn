import { NavWorkspaceSettings } from "@features/workspaces/components/nav/nav-workspace-settings";
import { hasWorkspacePermission } from "@features/workspaces/workspaces-permissions";

export async function WorkspaceSettingsNav({
  organizationId,
  organizationKey,
}: Readonly<{
  organizationId: string;
  organizationKey: string;
}>) {
  const canCreateInvitations = await hasWorkspacePermission(organizationId, {
    invitation: ["create"],
  });

  return (
    <NavWorkspaceSettings
      organizationKey={organizationKey}
      canCreateInvitations={canCreateInvitations}
    />
  );
}
