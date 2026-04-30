import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@lib/utils";

export const NavWorkspaceSettingsSkeleton = ({ className }: { className?: string }) => (
  <div
    data-slot="workspace-settings-nav-skeleton"
    aria-busy="true"
    className={cn("bg-background flex h-full flex-col border-r", className)}
  >
    <div className="flex min-h-12 items-center justify-between border-b px-3 py-2">
      <Skeleton className="h-5 w-24" />
    </div>
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  </div>
);
