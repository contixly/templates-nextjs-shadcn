import { IconChecklist, IconStarFilled, IconTargetArrow } from "@tabler/icons-react";
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
import { WorkspaceSettingsDialog } from "@features/workspaces/components/forms/workspace-settings-dialog";
import { MenuItem } from "@typings/ui";

interface WorkspaceCardProps {
  workspace: WorkspaceWithCounts;
  canDelete?: boolean;
  canChangeDefault?: boolean;
}

export function WorkspaceCard({ workspace, canDelete, canChangeDefault }: WorkspaceCardProps) {
  const stats = [
    {
      label: "Tasks",
      icon: IconChecklist,
      count: workspace._count.tasks ?? 0,
    },
    {
      label: "Notes",
      count: workspace._count.notes ?? 0,
    },
    {
      label: "Goals",
      icon: IconTargetArrow,
      count: workspace._count.goals ?? 0,
    },
  ] as (MenuItem & { count: number })[];

  return (
    <Card className="bg-card flex h-full w-full max-w-md min-w-0 flex-col shadow-none transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {workspace.name}
              {workspace.isDefault && <IconStarFilled className="size-4 text-yellow-500" />}
            </CardTitle>
            <CardDescription>
              {workspace.isDefault ? "Default Workspace" : "Custom Workspace"}
            </CardDescription>
          </div>
          <WorkspaceSettingsDialog workspace={workspace} canChangeDefault={canChangeDefault} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const content = (
              <>
                {stat.icon && <stat.icon className="text-muted-foreground size-5" />}
                <span className="text-2xl font-bold">{stat.count}</span>
                <span className="text-muted-foreground text-xs">{stat.label}</span>
              </>
            );

            if (stat.url) {
              return (
                <Link
                  key={stat.label}
                  href={stat.url}
                  className="hover:bg-accent flex aspect-3/2 flex-col items-center justify-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={stat.label}
                className="flex aspect-3/2 cursor-default flex-col items-center justify-center gap-3 rounded-lg border p-3 opacity-50"
                title={`${stat.label} — Coming soon`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/${workspace.id}`}>View Workspace</Link>
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
    <div className="grid grid-cols-3 gap-4 px-4">
      <Skeleton className="aspect-3/2 w-full" />
      <Skeleton className="aspect-3/2 w-full" />
      <Skeleton className="aspect-3/2 w-full" />
    </div>
    <div className="border-t p-4">
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
);
