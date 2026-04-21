import React, { Suspense, use } from "react";
import { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { ActionResult } from "@typings/actions";
import { WorkspacesEmptyState } from "@features/workspaces/components/ui/workspaces-empty-state";
import {
  WorkspaceCard,
  WorkspaceCardSkeleton,
} from "@features/workspaces/components/ui/workspace-card";

const pageLayoutClassName =
  "flex w-full max-w-[1360px] flex-1 flex-col gap-6 pb-8 xl:flex-row xl:items-start xl:gap-8";
const asideClassName = "w-full shrink-0 xl:sticky xl:top-6 xl:w-[360px]";
const mainClassName = "min-w-0 flex-1 xl:max-w-[944px] px-4 xl:px-0";
const workspacesGridClassName =
  "grid w-full content-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,24rem),1fr))] justify-center";

const UserWorkspacesLoadingState = () => (
  <div className={pageLayoutClassName}>
    <aside className={asideClassName}>
      <WorkspacesEmptyState empty={false} />
    </aside>

    <main className={mainClassName}>
      <div className={workspacesGridClassName}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <WorkspaceCardSkeleton key={idx} />
        ))}
      </div>
    </main>
  </div>
);

const UserWorkspacesComponent = ({ loadUserWorkspacesPromise }: UserWorkspacesProps) => {
  const { success, data: workspaces, error } = use(loadUserWorkspacesPromise);
  const workspaceItems = workspaces ?? [];
  const isEmpty = success && workspaceItems.length === 0;

  return (
    <div className={pageLayoutClassName}>
      <aside className={asideClassName}>
        <WorkspacesEmptyState empty={isEmpty} />
      </aside>

      <main className={mainClassName}>
        {success && workspaceItems.length > 0 && (
          <div className={workspacesGridClassName}>
            {workspaceItems.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                canDelete={workspaceItems.length > 1}
              />
            ))}
          </div>
        )}

        {success && isEmpty && (
          <div className="text-muted-foreground flex min-h-56 w-full items-center justify-center rounded-none border border-dashed p-6 text-center text-sm">
            Workspace list is empty.
          </div>
        )}

        {!success && (
          <div className="text-muted-foreground flex min-h-56 w-full items-center justify-center rounded-none border border-dashed p-6 text-center">
            {error?.message ?? "Unable to load workspaces right now. Please try again shortly."}
          </div>
        )}
      </main>
    </div>
  );
};

interface UserWorkspacesProps {
  loadUserWorkspacesPromise: Promise<ActionResult<WorkspaceWithCounts[]>>;
}

export const UserWorkspaces = (props: UserWorkspacesProps) => {
  return (
    <Suspense fallback={<UserWorkspacesLoadingState />}>
      <UserWorkspacesComponent {...props}></UserWorkspacesComponent>
    </Suspense>
  );
};
