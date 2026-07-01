"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { SettingsSection } from "@components/application/settings/settings-shell";
import { IconBuilding, IconKey, IconShieldCheck, IconUser } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import routes from "@features/routes";
import type { ApiKeyOwnerType } from "@features/api-keys/api-keys-types";

export function ApiKeyEducationSection({ ownerType }: { ownerType: ApiKeyOwnerType }) {
  const t = useTranslations("apiKeys.ui");

  return (
    <SettingsSection
      title={t("education.title")}
      description={t("education.description")}
      action={
        ownerType === "organization" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.accounts.pages.api_keys.path()}>
              <IconKey data-icon="inline-start" />
              {t("education.personalLink")}
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <EducationItem
          icon={<IconUser aria-hidden="true" className="size-4" />}
          title={t("education.personalTitle")}
          description={t("education.personalDescription")}
        />
        <EducationItem
          icon={<IconBuilding aria-hidden="true" className="size-4" />}
          title={t("education.organizationTitle")}
          description={t("education.organizationDescription")}
        />
        <EducationItem
          icon={<IconShieldCheck aria-hidden="true" className="size-4" />}
          title={t("education.scopesTitle")}
          description={t("education.scopesDescription")}
        />
        <EducationItem
          icon={<IconKey aria-hidden="true" className="size-4" />}
          title={t("education.managementTitle")}
          description={t("education.managementDescription")}
        />
      </div>
    </SettingsSection>
  );
}

function EducationItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-none">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
