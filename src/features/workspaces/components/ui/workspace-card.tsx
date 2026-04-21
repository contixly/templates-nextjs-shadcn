import { IconSettings, IconStarFilled } from "@tabler/icons-react";
import NextLink from "next/link";
import Link from "@components/ui/custom/animated-link";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { Skeleton } from "@components/ui/skeleton";
import { WorkspaceDeleteDialog } from "@features/workspaces/components/forms/workspace-delete-dialog";
import { useTranslations } from "next-intl";
import routes from "@features/routes";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";

interface WorkspaceCardProps {
  workspace: WorkspaceWithCounts;
  canDelete?: boolean;
}

export function WorkspaceCard({ workspace, canDelete }: WorkspaceCardProps) {
  const t = useTranslations("workspaces.ui.card");
  const organizationKey = getOrganizationRouteKey(workspace);

  return (
    <Card className="bg-card flex h-full w-full max-w-md min-w-0 flex-col shadow-none transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {workspace.name}
              {workspace.isDefault && <IconStarFilled className="size-4 text-yellow-500" />}
            </CardTitle>
            <CardDescription>{workspace.isDefault ? t("default") : t("custom")}</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon">
            <NextLink
              href={routes.workspaces.pages.settings_workspace.path({
                organizationKey,
              })}
              aria-label={t("settings")}
            >
              <IconSettings className="size-4" />
              <span className="sr-only">{t("settings")}</span>
            </NextLink>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t("slugLabel")}</span>
          <code className="bg-muted rounded px-2 py-1 text-xs">{workspace.slug ?? "n/a"}</code>
        </div>
        <p className="text-muted-foreground text-sm">
          {/* Template placeholder — add domain-specific metrics or links when you model relations in Prisma. */}
          {t("summary")}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link
            href={routes.workspaces.pages.workspace.path({
              organizationKey,
            })}
          >
            {t("open")}
          </Link>
        </Button>
        {canDelete && <WorkspaceDeleteDialog workspace={workspace} triggerClassName="w-full" />}
      </CardFooter>
    </Card>
  );
}

export const WorkspaceCardSkeleton = () => (
  <div className="ring-foreground/10 bg-card flex w-full min-w-0 flex-col gap-4 overflow-hidden rounded-none py-4 ring-1">
    <div className="space-y-2 px-4">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
    <div className="px-4">
      <Skeleton className="h-16 w-full" />
    </div>
    <div className="border-t p-4">
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
);
