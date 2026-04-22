"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { WorkspaceCreateDialog } from "@features/workspaces/components/forms/workspace-create-dialog";
import { IconMailPlus, IconPlus } from "@tabler/icons-react";
import routes from "@features/routes";

const onboardingActionClassName =
  "h-auto min-h-9 py-2 [&>span:last-child]:overflow-visible [&>span:last-child]:text-clip [&>span:last-child]:whitespace-normal";

export const WorkspaceOnboardingGuard = () => {
  const t = useTranslations("workspaces.ui.onboarding");

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
              <Button size="lg" className={onboardingActionClassName}>
                <IconPlus className="size-4" />
                {t("createAction")}
              </Button>
            }
          />
          <Button size="lg" variant="outline" className={onboardingActionClassName} asChild>
            <Link href={routes.accounts.pages.invitations.path()}>
              <IconMailPlus className="size-4" />
              {t("inviteAction")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
