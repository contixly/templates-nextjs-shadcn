import type { Metadata } from "next";
import { SettingsPageSection } from "@components/application/settings/settings-shell";
import { ApiKeyManagementPage } from "@features/api-keys/components/api-key-management-page";
import { loadPersonalApiKeysPageData } from "@features/api-keys/api-keys-management";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.api_keys);

export default async function UserApiKeysPage() {
  const pageData = await loadPersonalApiKeysPageData();

  return (
    <SettingsPageSection mode="wide">
      <ApiKeyManagementPage pageData={pageData} showIntro />
    </SettingsPageSection>
  );
}
