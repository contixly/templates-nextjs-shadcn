import React, { Suspense, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { IconAlertTriangle } from "@tabler/icons-react";
import { AccountDeleteDialog } from "@features/accounts/components/forms/account-delete-dialog";
import { User } from "better-auth";
import { Button } from "@components/ui/button";
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
  const tAccounts = useTranslations("accounts");

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconAlertTriangle className="text-destructive size-5" />
          <CardTitle className="text-destructive">{tAccounts("pages.danger.title")}</CardTitle>
        </div>
        <CardDescription>{tAccounts("pages.danger.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium">{tAccounts("ui.deleteDialog.title")}</h4>
              <p className="text-muted-foreground text-sm">
                {tAccounts("ui.deleteDialog.description")}
              </p>
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
      </CardContent>
    </Card>
  );
};
