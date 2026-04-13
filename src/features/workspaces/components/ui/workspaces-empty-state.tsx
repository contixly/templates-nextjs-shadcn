import { IconLayoutGridAdd } from "@tabler/icons-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@components/ui/empty";
import { WorkspaceCreateDialog } from "../forms/workspace-create-dialog";

interface WorkspacesEmptyStateProps {
  empty?: boolean;
}

export function WorkspacesEmptyState({ empty }: WorkspacesEmptyStateProps) {
  return (
    <Empty className="w-full min-w-0 p-1 md:p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconLayoutGridAdd className="text-muted-foreground size-12" />
        </EmptyMedia>
        {empty && (
          <>
            <EmptyTitle>No Workspaces Yet</EmptyTitle>
            <EmptyDescription>Create your first workspace to get started.</EmptyDescription>
          </>
        )}
      </EmptyHeader>
      <EmptyContent className="flex max-w-2xl flex-col items-center justify-center gap-8 px-1 text-center">
        <WorkspaceCreateDialog />
        <div className="text-muted-foreground grid w-fit gap-4 text-sm">
          <div className="flex items-start gap-3 text-left">
            <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <p className="text-foreground font-medium">Create a Workspace</p>
              <p>
                Start by creating a workspace for different aspects of your life like Work,
                Personal, or Projects.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <p className="text-foreground font-medium">Add Content</p>
              <p>
                Add notes, tasks, and goals to your workspace. Everything stays organized in its own
                space.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <p className="text-foreground font-medium">Switch Between Workspaces</p>
              <p>
                Easily switch between workspaces using the dropdown in the header to focus on what
                matters.
              </p>
            </div>
          </div>
        </div>
      </EmptyContent>
    </Empty>
  );
}
