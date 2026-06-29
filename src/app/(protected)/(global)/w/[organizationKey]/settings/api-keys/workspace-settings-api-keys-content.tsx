import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  SettingsPageSection,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { loadOrganizationApiKeysPageData } from "@features/api-keys/api-keys-management";
import { loadWorkspaceSettingsApiKeysPageContext } from "@features/workspaces/workspaces-settings";
import accountsRoutes from "@features/accounts/accounts-routes";
import workspaceRoutes from "@features/workspaces/workspaces-routes";

export interface WorkspaceSettingsApiKeysPageProps {
  params: Promise<{ organizationKey: string }>;
}

export async function WorkspaceSettingsApiKeysContent({
  params,
}: WorkspaceSettingsApiKeysPageProps) {
  const { organizationKey } = await params;
  const { workspace, canonicalOrganizationKey } =
    await loadWorkspaceSettingsApiKeysPageContext(organizationKey);

  if (organizationKey !== canonicalOrganizationKey) {
    redirect(
      workspaceRoutes.pages.settings_api_keys.path({
        organizationKey: canonicalOrganizationKey,
      })
    );
  }

  const [pageData, tableTranslations, educationTranslations] = await Promise.all([
    loadOrganizationApiKeysPageData({
      organizationId: workspace.id,
      organizationKey: canonicalOrganizationKey,
    }),
    getTranslations("apiKeys.ui.table"),
    getTranslations("apiKeys.ui.education"),
  ]);
  const canManageApiKeys =
    pageData.capabilities.canCreate ||
    pageData.capabilities.canUpdate ||
    pageData.capabilities.canDelete;

  return (
    <SettingsPageSection mode="wide">
      <SettingsSection
        title={tableTranslations("title")}
        description={tableTranslations("organizationDescription")}
      >
        <div className="text-muted-foreground grid gap-3 rounded-lg border border-dashed px-4 py-6 text-sm">
          <p>
            {pageData.keys.length > 0
              ? tableTranslations("loadedCount", { count: pageData.keys.length })
              : tableTranslations("emptyDescription")}
          </p>
          {!canManageApiKeys ? <p>{tableTranslations("readOnlyNotice")}</p> : null}
        </div>
      </SettingsSection>
      <SettingsSection
        title={educationTranslations("managementTitle")}
        description={educationTranslations("managementDescription")}
      >
        <div className="text-muted-foreground grid gap-3 text-sm">
          <p>{educationTranslations("organizationDescription")}</p>
          <Link
            href={accountsRoutes.pages.api_keys.path()}
            className="text-primary w-fit font-medium underline-offset-4 hover:underline"
          >
            {educationTranslations("personalLink")}
          </Link>
        </div>
      </SettingsSection>
    </SettingsPageSection>
  );
}
