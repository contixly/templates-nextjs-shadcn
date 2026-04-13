import React, { Suspense, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { IconAlertTriangle } from "@tabler/icons-react";
import { AccountDeleteDialog } from "@features/accounts/components/forms/account-delete-dialog";
import { User } from "better-auth";
import common from "@messages/common.json";
import { Button } from "@components/ui/button";

interface UserDangerousZoneProps {
  loadCurrentUserPromise: Promise<User | undefined>;
}

const AccountDeleteComponent = ({ loadCurrentUserPromise }: UserDangerousZoneProps) => {
  const user = use(loadCurrentUserPromise);

  if (!user?.email) return null;

  return <AccountDeleteDialog email={user?.email} />;
};

export const UserDangerousZone = (props: UserDangerousZoneProps) => {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconAlertTriangle className="text-destructive size-5" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Irreversible and destructive actions. Please proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-muted-foreground text-sm">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
            </div>
            <div className="shrink-0">
              <Suspense
                fallback={
                  <Button type="button" variant="destructive" disabled>
                    {common.words.verbs.delete}
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
