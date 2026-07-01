"use client";

import { Button } from "@components/ui/button";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { IconKey } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { ApiKeyCreateDialog } from "@features/api-keys/components/api-key-create-dialog";
import { ApiKeyEducationSection } from "@features/api-keys/components/api-key-education-section";
import { ApiKeyTable } from "@features/api-keys/components/api-key-table";
import type { ApiKeyManagementPageData } from "@features/api-keys/api-keys-types";

export function ApiKeyManagementPage({
  pageData,
  showIntro,
}: {
  pageData: ApiKeyManagementPageData;
  showIntro: boolean;
}) {
  const t = useTranslations("apiKeys.ui");
  const pageDescription =
    pageData.ownerType === "organization"
      ? t("table.organizationDescription")
      : t("table.personalDescription");

  return (
    <>
      {showIntro ? (
        <SettingsPageIntro title={t("table.title")} description={pageDescription} />
      ) : null}
      <ApiKeyEducationSection ownerType={pageData.ownerType} />
      <SettingsSection
        title={t("table.title")}
        description={pageDescription}
        action={
          pageData.capabilities.canCreate ? (
            <ApiKeyCreateDialog
              ownerType={pageData.ownerType}
              organizationId={pageData.organizationId}
              organizationKey={pageData.organizationKey}
              trigger={
                <Button size="sm" variant="outline">
                  <IconKey data-icon="inline-start" />
                  {t("table.createAction")}
                </Button>
              }
            />
          ) : null
        }
      >
        <ApiKeyTable
          ownerType={pageData.ownerType}
          organizationId={pageData.organizationId}
          organizationKey={pageData.organizationKey}
          keys={pageData.keys}
          capabilities={pageData.capabilities}
        />
      </SettingsSection>
    </>
  );
}
