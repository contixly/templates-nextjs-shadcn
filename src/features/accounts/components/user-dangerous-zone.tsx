import React, { Suspense, use } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { AccountDeleteDialog } from "@features/accounts/components/forms/account-delete-dialog";
import { User } from "better-auth";
import { Button } from "@components/ui/button";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { useTranslations } from "next-intl";

interface UserDangerousZoneProps {
  loadCurrentUserPromise: Promise<User | undefined>;
}

const AccountDeleteComponent = ({ loadCurrentUserPromise }: UserDangerousZoneProps) => {
  const user = use(loadCurrentUserPromise);

  if (!user?.email) return null;

  return <AccountDeleteDialog email={user?.email} />;
};

export const UserDangerousZone = (props: UserDangerousZoneProps) => {
  const tCommon = useTranslations("common");
  const tPage = useTranslations("accounts.pages.danger");
  const tDanger = useTranslations("accounts.ui.danger");
  const tDeleteDialog = useTranslations("accounts.ui.deleteDialog");

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />
      <SettingsSection
        title={
          <span className="flex items-center gap-2">
            <IconAlertTriangle className="text-destructive size-5" />
            {tDanger("title")}
          </span>
        }
        description={tDanger("description")}
        variant="destructive"
      >
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium">{tDeleteDialog("title")}</h3>
              <p className="text-muted-foreground text-sm">{tDeleteDialog("description")}</p>
            </div>
            <div className="shrink-0">
              <Suspense
                fallback={
                  <Button type="button" variant="destructive" disabled>
                    {tCommon("words.verbs.delete")}
                  </Button>
                }
              >
                <AccountDeleteComponent {...props} />
              </Suspense>
            </div>
          </div>
        </div>
      </SettingsSection>
    </>
  );
};
