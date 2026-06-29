import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  SettingsPageIntro,
  SettingsPageSection,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { loadPersonalApiKeysPageData } from "@features/api-keys/api-keys-management";
import accountsRoutes from "@features/accounts/accounts-routes";
import { buildPageMetadata } from "@lib/metadata";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.api_keys);

export default async function UserApiKeysPage() {
  const [pageData, pageTranslations, tableTranslations, educationTranslations] = await Promise.all([
    loadPersonalApiKeysPageData(),
    getTranslations("accounts.pages.api_keys"),
    getTranslations("apiKeys.ui.table"),
    getTranslations("apiKeys.ui.education"),
  ]);

  return (
    <SettingsPageSection mode="wide">
      <SettingsPageIntro
        title={pageTranslations("title")}
        description={pageTranslations("description")}
      />
      <SettingsSection
        title={tableTranslations("title")}
        description={tableTranslations("personalDescription")}
      >
        <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">
          {pageData.keys.length > 0
            ? tableTranslations("loadedCount", { count: pageData.keys.length })
            : tableTranslations("emptyDescription")}
        </div>
      </SettingsSection>
      <SettingsSection
        title={educationTranslations("title")}
        description={educationTranslations("description")}
      >
        <div className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-foreground font-medium">
              {educationTranslations("personalTitle")}
            </span>
            <br />
            {educationTranslations("personalDescription")}
          </p>
          <p>
            <span className="text-foreground font-medium">
              {educationTranslations("organizationTitle")}
            </span>
            <br />
            {educationTranslations("organizationDescription")}
          </p>
        </div>
      </SettingsSection>
    </SettingsPageSection>
  );
}
