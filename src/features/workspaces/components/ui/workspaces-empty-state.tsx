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
import { useTranslations } from "next-intl";

interface WorkspacesEmptyStateProps {
  empty?: boolean;
}

export function WorkspacesEmptyState({ empty }: WorkspacesEmptyStateProps) {
  const t = useTranslations("workspaces.ui.emptyState");

  return (
    <Empty className="w-full min-w-0 p-1 md:p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconLayoutGridAdd className="text-muted-foreground size-12" />
        </EmptyMedia>
        {empty && (
          <>
            <EmptyTitle>{t("title")}</EmptyTitle>
            <EmptyDescription>{t("description")}</EmptyDescription>
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
              <p className="text-foreground font-medium">{t("steps.create.title")}</p>
              <p>{t("steps.create.description")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <p className="text-foreground font-medium">{t("steps.domain.title")}</p>
              <p>{t("steps.domain.description")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <p className="text-foreground font-medium">{t("steps.switch.title")}</p>
              <p>{t("steps.switch.description")}</p>
            </div>
          </div>
        </div>
      </EmptyContent>
    </Empty>
  );
}
