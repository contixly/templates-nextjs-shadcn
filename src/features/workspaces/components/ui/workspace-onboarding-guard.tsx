import { getTranslations } from "next-intl/server";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { WorkspaceCreateDialog } from "@features/workspaces/components/forms/workspace-create-dialog";
import { IconMailPlus, IconPlus } from "@tabler/icons-react";

export const WorkspaceOnboardingGuard = async () => {
  const t = await getTranslations("workspaces.ui.onboarding");

  return (
    <section className="flex w-full flex-1 items-center justify-center px-4 py-8 lg:px-6">
      <Card className="w-full max-w-2xl shadow-none">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription className="text-base">{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <WorkspaceCreateDialog
            trigger={
              <Button size="lg">
                <IconPlus className="size-4" />
                {t("createAction")}
              </Button>
            }
          />
          <Button size="lg" variant="outline" disabled title={t("inviteHint")}>
            <IconMailPlus className="size-4" />
            {t("inviteAction")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
